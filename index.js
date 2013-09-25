var setup = function(subject, options) {
    var connect = require('connect');

    var app = connect().use(connect.static(__dirname+'/public'));
    var http = require('http').createServer(app);
    var monitor = require('socket.io').listen(http);

    monitor.set('log level', 0);
    var ns = monitor.of('');

    http.listen(options.port);

    var attachEventHandlers = function(namespace) {
        var handlePacket = namespace.handlePacket;
        namespace.handlePacket = function(sessId, packet) {
            handlePacket.bind(namespace, sessId, packet)();
            if(packet.type !== 'event')
                return ;

            ns.emit('activity', sessId, packet.name);
        }
    }

    var disconnect = function() {
        ns.emit('_disconnect', this.id);
    }

    var connection = function(socket) {
        var stats = {
            namespaces:{}
        };

        for(var namespace_name in subject.namespaces) {
            attachEventHandlers(subject.namespaces[namespace_name]);

            stats.namespaces[namespace_name] = {
                connections:0
            }

            var sockets = subject.namespaces[namespace_name].sockets;
            for(var i in sockets)
                stats.namespaces[namespace_name].connections++;
        }

        ns.emit('_connect', socket.id, socket.handshake);

        socket.on('disconnect', disconnect);
    }

    subject.on('connection', connection);
}

module.exports = setup;