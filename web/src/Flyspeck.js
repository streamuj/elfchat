/*
 * Flyspeck is Dependency Injection Container.
 *
 * Copyright (c) 2014 Anton Medvedev
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished
 * to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

class Flyspeck {
    constructor() {
        this.values = {};
        this.factories = {};
    }

    set(name, callable) {
        if (typeof callable === "function") {
            this.factories[name] = callable;
        } else {
            this.value = callable;
        }
    }

    get(name) {
        if (this.values[name] === undefined) {
            this.values[name] = this.factories[name](this);
        }
        return this.values[name];
    }

    extend(name, callable) {
        var factory = this.factories[name];

        if (factory === undefined) {
            throw "Factory `" + name + "` does not found.";
        }

        this.factories[name] = function (container) {
            return callable(factory(container), container);
        };
    }
}