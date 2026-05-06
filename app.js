(async function () {
  const ws = await connectToServer();
  document.body.onmousemove = (e) => {
    const message = {
      x: e.clientX,
      y: e.clientY,
    };
    ws.send(JSON.stringify(message));
  };

  ws.onmessage = (wsmessage) => {
    const message = JSON.parse(wsmessage.data);
    const cursor = getOrCreateCursorFor(message);

    const width = window.innerWidth;
    const margin = 5 * 16;
    const height = window.innerHeight;

    let angle = null;

    const distLeft = message.x;
    const distRight = width - message.x;
    const distTop = message.y;
    const distBottom = height - message.y;

    const min = Math.min(distLeft, distBottom, distRight, distTop);

    if (min < margin) {
      if (min === distLeft) angle = 180;
      else if (min === distRight) angle = 0;
      else if (min === distTop) angle = 270;
      else if (min === distBottom) angle = 90;
    } else {
      const dx = message.x - (cursor._prevX ?? message.x);
      const dy = message.y - (cursor._prevY ?? message.y);

      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        if (Math.abs(dx) > Math.abs(dy)) {
          angle = dx > 0 ? 0 : 180;
        } else {
          angle = dy > 0 ? 90 : -90;
        }
      }
    }

    if (angle !== null) {
      cursor.style.transform = `translate(${message.x}px, ${message.y}px) translate(-50%, -50%) rotate(${angle}deg)`;
    }
    cursor._prevX = message.x;
    cursor._prevY = message.y;
  };
})();

async function connectToServer() {
  const ws = new WebSocket(`ws://localhost:8080/ws`);
  return new Promise((resolve, reject) => {
    const timer = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        clearInterval(timer);
        resolve(ws);
      }
    }, 10);
  });
}

function getOrCreateCursorFor(msg) {
  const sender = msg.sender;
  const existing = document.querySelector(`[data-sender='${sender}']`);
  if (existing) {
    return existing;
  }

  const template = document.getElementById("cursor");
  const cursor = template.content.firstElementChild.cloneNode(true);
  const svgPath = cursor.getElementsByTagName("path")[0];

  cursor.setAttribute("data-sender", sender);
  svgPath.setAttribute("fill", `hsl(${msg.color}, 50%, 50%)`);
  document.body.appendChild(cursor);

  return cursor;
}
