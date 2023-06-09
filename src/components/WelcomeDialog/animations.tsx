import {Point} from "@utils/geometry";

import "./animation.css";

function createCursor(): Node {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "24px");
    svg.setAttribute("height", "24px");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    svg.setAttribute("x", "0px");
    svg.setAttribute("y", "0px");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("xml:space", "preserve");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("style", "fill: #010202; stroke: #FFFFFF; stroke-miterlimit: 10; stroke-width: 2;");
    path.setAttribute(
        "d",
        "M8.6,23.8C6.7,23.7,2.6,1.1,3.7,0.3S23.5,13,23,14.3c-0.5,1.3-6.9,0.7-8.9,2S10,23.6,8.6,23.8z"
    );
    svg.appendChild(path);
    return svg;
}

export function animateMouseClick(options: {target: HTMLElement; flyIn: boolean; onFinished?: () => void}): void {
    const cursor = document.createElement("div");
    cursor.classList.add("MouseCursor");
    const targetRect = options.target.getBoundingClientRect();
    let startPosition: Point = {
        x: targetRect.left,
        y: targetRect.top,
    };
    if (options.flyIn) {
        if (targetRect.left < window.innerWidth / 2) {
            startPosition.x = targetRect.left + 50;
        } else {
            startPosition.x = targetRect.left - 50;
        }
        if (targetRect.top < window.innerHeight / 2) {
            startPosition.y = targetRect.top + 50 + 24;
        } else {
            startPosition.y = targetRect.top - 50 + 24;
        }
    }

    const targetPosition: Point = {
        x: targetRect.left + targetRect.width / 2,
        y: targetRect.top + targetRect.height / 2 + 24,
    };

    cursor.style.left = `${startPosition.x}px`;
    cursor.style.top = `${startPosition.y}px`;

    const cursorIcon = createCursor();
    cursor.appendChild(cursorIcon);
    const clickEffect = document.createElement("div");
    document.body.appendChild(clickEffect);
    document.body.appendChild(cursor);

    window.setTimeout(() => {
        const animation = cursor.animate(
            [
                {
                    left: `${startPosition.x}px`,
                    top: `${startPosition.y}px`,
                },
                {
                    left: `${targetPosition.x}px`,
                    top: `${targetPosition.y}px`,
                },
            ],
            {
                duration: 500,
                easing: "ease-in-out",
                fill: "forwards",
            }
        );
        animation.addEventListener("finish", () => {
            clickEffect.style.left = `${targetPosition.x}px`;
            clickEffect.style.top = `${targetPosition.y}px`;
            clickEffect.classList.add("ClickEffect");
            if (options.onFinished) {
                options.onFinished();
            }
            window.setTimeout(() => {
                document.body.removeChild(cursor);
                document.body.removeChild(clickEffect);
            }, 350);
        });
    });
}
