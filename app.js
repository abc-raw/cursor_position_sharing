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
    const width = window.innerWidth;
    const margin = 0.05 * width;
    const height = window.innerHeight;

    const message = JSON.parse(wsmessage.data);
    const cursor = getOrCreateCursorFor(message);

    let angle = null;

    if (message.x < margin) {
      angle = 0; // right
    } else if (message.x > width - margin) {
      angle = 90; // down
    } else if (message.y < margin) {
      angle = 180; // left
    } else if (message.y > height - margin) {
      angle = 270; // up
    }

    if (angle !== null) {
      cursor.style.transform = `translate(${message.x}px, ${message.y}px) translate(-50%, -50%) rotate(${angle}deg)`;
    } else {
      cursor.style.transform = `translate(${message.x}px, ${message.y}px) translate(-50%, -50%)`;
    }
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
