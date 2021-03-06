/* (c) Anton Medvedev <anton@elfet.ru>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class AjaxServer extends AbstractServer {
    constructor(api, period) {
        super();
        this.api = api;
        this.period = period;
        this.interval = null;
        this.pulling = false;
        this.last = 0;
    }

    connect() {
        this.onConnect();
        this.interval = setInterval(() => {
            this.pull();
        }, this.period);
    }

    pull() {
        if (this.pulling) {
            return;
        }

        this.pulling = true;
        $.getJSON(this.api.poll, {last: this.last})
            .done((data) => {
                if (!this.connected) {
                    this.onConnect();
                }
                this.last = data.last;

                for (var i of data.queue) {
                    this.onData(i);
                }
            })
            .fail((xhr, status) => {
                if (this.connected) {
                    this.onError(status);
                }
                this.onDisconnect();
                window.location.reload();
            })
            .always(() => {
                this.pulling = false;
            });
    }

    onConnect() {
        super.onConnect();
        this.synchronize();
    }

    sendData(data) {
        $.post(this.api.send, {data})
            .done(() => {
                this.pull();
            })
            .fail((xhr, status) => {
                this.onError(status);
            });
    }

    synchronize() {
        $.post(this.api.synchronize, 'json')
            .done((data) => {
                this.onData(data);
            });
    }
}