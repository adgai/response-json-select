// ==UserScript==
// @name         Intercept XHR & Fetch and Log Responses
// @namespace    http://yournamespace.com
// @version      1.3
// @description  Intercept XHR & Fetch requests, show in draggable floating panel with clear button
// @match        *://*/*
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/jsonpath@1.1.1/jsonpath.min.js
// ==/UserScript==

(function () {
    'use strict';

    let jsonStr = [
        {
            "url": "paomi.com",
            "list": [
                {
                    "desc": "test",
                    "get_code": "$.DATA.DomainCheckResultList[*].Domain"
                }
            ]
        }
    ];

    const classNames = 'sfasfsfsfs';

    // 公用的渲染函数
    function handleResponse(url, text) {
        let jj;
        try {
            jj = JSON.parse(text);
        } catch (_) {
            return; // 不是 JSON
        }

        let container = document.querySelector("." + classNames);
        if (!container) {
            // 外层容器
            container = document.createElement("div");
            container.className = classNames;
            container.style = `
                position: fixed;
                top: 100px;
                right: 100px;
                width: 300px;
                max-height: 400px;
                display: flex;
                flex-direction: column;
                background: rgb(179, 235, 156);
                border: 1px solid #999;
                font-size: 12px;
                z-index: 999999;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            `;

            // 标题栏
            let header = document.createElement("div");
            header.style = `
                background: #4caf50;
                color: white;
                padding: 4px;
                cursor: move;
                font-weight: bold;
                display: flex;
                justify-content: space-between;
                align-items: center;
                user-select: none;
            `;

            let title = document.createElement("span");
            title.textContent = "📡 Intercepted Data";

            let btns = document.createElement("div");

            // 收起/展开按钮
            let toggleBtn = document.createElement("button");
            toggleBtn.textContent = "▼";
            toggleBtn.style = "margin-left:5px; cursor:pointer;";
            toggleBtn.onclick = () => {
                if (content.style.display === "none") {
                    content.style.display = "block";
                    toggleBtn.textContent = "▼";
                } else {
                    content.style.display = "none";
                    toggleBtn.textContent = "▲";
                }
            };

            // 清空按钮
            let clearBtn = document.createElement("button");
            clearBtn.textContent = "❌";
            clearBtn.style = "margin-left:5px; cursor:pointer;";
            clearBtn.onclick = () => {
                content.innerHTML = "";
            };

            btns.appendChild(toggleBtn);
            btns.appendChild(clearBtn);

            header.appendChild(title);
            header.appendChild(btns);

            let content = document.createElement("div");
            content.className = "content";
            content.style = `
                overflow: auto;
                padding: 5px;
                white-space: pre-wrap;
                word-break: break-all;
                flex-grow: 1;
                background: #f9f9f9;
            `;

            container.appendChild(header);
            container.appendChild(content);
            document.body.append(container);

            // 使容器可拖动
            makeDraggable(container, header);
        }

        let content = container.querySelector(".content");

        for (const e of jsonStr) {
            if (url.includes(e.url)) {
                for (const eElement of e.list) {
                    let span = document.createElement("div");
                    try {
                        if (eElement.get_code.startsWith('$')) {
                            span.textContent = eElement.desc + "：" + JSON.stringify(jsonpath.query(jj, eElement.get_code));
                        } else {
                            let jjAlias = jj; // 给 eval 用
                            span.textContent = eElement.desc + "：" + eval(eElement.get_code);
                        }
                    } catch (err) {
                        span.textContent = eElement.desc + "：解析失败 - " + err.message;
                    }
                    content.appendChild(span);
                }
            }
        }
    }

    // 让容器可以拖动
    function makeDraggable(container, handle) {
        let offsetX, offsetY, dragging = false;

        handle.addEventListener("mousedown", (e) => {
            dragging = true;
            offsetX = e.clientX - container.offsetLeft;
            offsetY = e.clientY - container.offsetTop;
            document.addEventListener("mousemove", move);
            document.addEventListener("mouseup", stop);
        });

        function move(e) {
            if (!dragging) return;
            container.style.left = (e.clientX - offsetX) + "px";
            container.style.top = (e.clientY - offsetY) + "px";
            container.style.right = "auto"; // 拖动后取消固定 right
        }

        function stop() {
            dragging = false;
            document.removeEventListener("mousemove", move);
            document.removeEventListener("mouseup", stop);
        }
    }

    // Hook XHR
    var originalXhrOpen = window.XMLHttpRequest.prototype.open;
    var originalXhrSend = window.XMLHttpRequest.prototype.send;

    window.XMLHttpRequest.prototype.open = function (method, url) {
        this._url = url;
        return originalXhrOpen.apply(this, arguments);
    };

    window.XMLHttpRequest.prototype.send = function () {
        this.addEventListener('load', function () {
            let ct = this.getResponseHeader && this.getResponseHeader('Content-Type');
            if (ct && ct.includes('json')) {
                handleResponse(this.responseURL, this.responseText);
            }
        });
        return originalXhrSend.apply(this, arguments);
    };

    // Hook fetch
    var originalFetch = window.fetch;
    window.fetch = function () {
        const fetchArgs = arguments;
        return originalFetch.apply(this, fetchArgs).then(res => {
            const clone = res.clone();
            clone.text().then(text => {
                console.log(text)
                console.log(res.headers.get("Content-Type"))
                const ct = res.headers.get("Content-Type") || "";
                if (ct === "application/json;charset=UTF-8") {
                    handleResponse(fetchArgs[0], text);
                }
            });
            return res;
        });
    };

})();
