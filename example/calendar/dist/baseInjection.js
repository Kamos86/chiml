"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chiml_1 = require("chiml");
class BaseInjection {
    constructor() {
        this.calCommand = "ncal ${1} -h";
        this.imageFetcherCommand = "curl https://somewhere.com/randomImage.json";
        this.imageKey = "image";
        this.writeHtmlCommand = `echo \${1} > "${__dirname}/calendar.html"`;
        this.showCalendarCommand = `google-chrome file://${__dirname}/calendar.html`;
        this.X = chiml_1.X;
    }
    composeHtml(imageUrl, calendar) {
        return `<img style="max-width: 50%; float:left;" src="${imageUrl}" />` +
            `<pre style="float:right">${calendar}</pre>`;
    }
}
exports.BaseInjection = BaseInjection;
