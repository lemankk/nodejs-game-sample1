/**
 * Created by leman on 9/5/2014.
 */



var Room = function(id, owner){
    this.id = id;
    this.owner = owner;
}
Room.maximunRoom = 10000;
Room.instances = {};
Room.counter = 0;
Room.prototype.id = null;
Room.prototype.owner = null;
Room.prototype.player = null;
Room.prototype.setPlayer = function(socket){
    var self = this;


    self.player = socket;
    socket.on('pos', function(data){
        if(self.owner != null)
            self.owner.emit('pos',data);
    });
    socket.on('action', function(data){
        if(self.owner != null)
            self.owner.emit('action',data);
    });
    socket.on('room-disconnect', function(){
        self.removePlayer();
    });
    socket.on('disconnect', function(){
        self.removePlayer();
    });
    self.playerDidConnect();
}
Room.prototype.playerDidConnect = function(){
    var self = this;

    if(self.owner != null)
        self.owner.emit('room-connect',{room: self.id});
    if(self.player != null)
        self.player.emit('room-connect',{room: self.id});
}
Room.prototype.playerDidDisconnect = function(){
    var self = this;

    if(self.owner != null)
        self.owner.emit('room-disconnect',{room: self.id});
    if(self.player != null)
        self.player.emit('room-disconnect',{room: self.id});
}
Room.prototype.removePlayer = function(){
    var self = this;
    var socket = self.player;

    self.playerDidDisconnect();
    self.player = null;

    if( socket != null) {
        socket.disconnect();
        socket = null;
    }
};
Room.prototype.setOwner = function(socket){
    var self = this;
    this.owner = socket;
    socket.emit('room-create', { room: self.id });
    socket.on('room-close', function (data) {
        Room.destroy( self );
        room = null;
    });
    socket.on('disconnect', function(){
        Room.destroy( self );
        room = null;
    });
    if( self.player != null){
        self.playerDidConnect();
    }
}
Room.prototype.destroy = function(){
    if( this.owner != null ){
        this.owner.emit('room-end');
    }
    if( this.player != null ){
        this.player.emit('room-end');
    }
    this.removePlayer();
    this.player = null;
    this.owner = null;
}

Room.tryConnectOwner = function(roomNo,socket){

    console.log('Try to connect ',roomNo);
    var room = Room.get(roomNo);
    if(room != null) {

        if( room.player != null){
            socket.emit('room-connect',{error:{type:'exist'}});
            return;
        }

        room.setPlayer(socket);
        return;
    }
    socket.emit('room-connect',{error:{type:'not_found'}});
    console.error('Cannot find target room',roomNo);
}
Room.get = function(roomNo){
    if(typeof Room.instances[roomNo ] != 'undefined') {
        return Room.instances[roomNo];
    }
    return null;
}
Room.create = function(socket){

    if( Room.counter >= Room.maximunRoom ){
        socket.emit('room-create',{error:{type:'full'}});
        return null;
    }

    var roomNo = null;
    var error = 0;

    roomNo = Math.random() *  Room.maximunRoom << 0 + 1;
    do {
        if( Room.get (roomNo) !=null) {


            error ++;
            roomNo ++;
            roomNo %= maxRoom;
            continue;
        }

    } while ( false );

    var room =new Room( roomNo);
    room.setOwner( socket );
    Room.instances[ roomNo ] = room;
    Room.counter ++;

    return room;
}
Room.destroy = function(room){
    var roomID = null;
    if( typeof room == 'object'){
        roomID = room.id;
    }else{
        roomID = room;
    }
    if( typeof Room.instances[ roomID ] != 'undefined'){
        var room = Room.instances[ roomID ];
        room.destroy();
        room = null;
        Room.instances[ roomID ] = null;
        Room.counter --;
    }
}

module.exports = Room;
