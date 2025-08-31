// ==UserScript==
// @name         Intercept XHR Requests and Log Responses
// @namespace    http://yournamespace.com
// @version      1.0
// @description  Intercept XHR requests and log responses to the console
// @match        *://*/*
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/jsonpath@1.1.1/jsonpath.min.js
// ==/UserScript==

(function () {
    'use strict';


    let jsonStr = '[\n' +
        '    {\n' +
        '        "url":"paomi.com",\n' +
        '        "list":[\n' +
        '            {\n' +
        '                "desc":"test",\n' +
        '                "get_code":"$.DATA.DomainCheckResultList[*].Domain"\n' +
        '            }\n' +
        '        ]\n' +
        '    }\n' +
        ']'

    // 保存原始的XMLHttpRequest对象以备后用
    var originalXhrOpen = window.XMLHttpRequest.prototype.open;

    // 重写XMLHttpRequest的open方法
    window.XMLHttpRequest.prototype.open = function () {
        this.addEventListener('load', function () {
            // 当请求完成时，打印响应
            // console.log('XHR Response:',  this);
            console.log('XHR Response:', this.getResponseHeader('Content-Type'));
            let ct = this.getResponseHeader('Content-Type')
            if (ct.includes('json')) {
                console.log(this);
                let classNames = 'sfasfsfsfs';

                let div
                let elementsByClassName = document.getElementsByClassName(classNames);
                if (elementsByClassName.length === 0) {
                    console.log('初始化JsonViewDiv')
                    div = document.createElement("div");
                    div.className = classNames
                    div.innerHTML = '';
                    div.style =  'display: flex;\n' +
                        '    width: 100px;\n' +
                        '    height: 100px;\n' +
                        '    background: rgb(179, 235, 156);\n' +
                        '    position: fixed;\n' +
                        '    top: 100px;\n' +
                        '    right: 100px;\n' +
                        '    flex-direction: column;'

                    document.body.append(div);
                } else {
                    div = elementsByClassName[0]
                }


                let jj = JSON.parse(this.responseText);
                let json = JSON.parse(jsonStr)
                for (const e of json) {
                    if (this.responseURL.includes(e.url)) {

                        for (const eElement of e.list) {
                            let span = document.createElement("span");
                            // span.textContent = eElement.desc + eval(eElement.get_code)
                            span.textContent = eElement.desc + jsonpath.query(jj, eElement.get_code)
                            div.append(span)
                        }

                    }

                }


            }

        });

        // 调用原始的open方法
        originalXhrOpen.apply(this, arguments);
    };
})();
