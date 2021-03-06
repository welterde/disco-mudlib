World = new Class({

	Extends: Base,
	players: {},
	rooms: {},
	commands: {},
	items: {},
	npcs: {},
	menus: {},
	failedFiles: [],
	name: null,
	basePath: null,
	enginePath: 'engine/',
	commandPath: 'commands/',
	roomPath: 'rooms/',
	itemPath: 'items/',
	npcPath: 'npcs/',
	savePath: 'saves/',
	menuPath: 'menus/',
	conversationPath: 'convos/',

	/**
	 * The name of the world will determine the path to the world's room and
	 * object files.
	 */
	init: function(name) {
		this.set('name', name);
		this.basePath = name+'/';
		this.players = this.players;
		this.rooms   = this.rooms;
		this.items   = this.items;
	},

	/**
	 * Adds the player to the world.
	 */
	addPlayer: function(player) {
		player.world = this;
		this.players[player.name.toLowerCase()] = player;
		this.announce(player.name+" has entered the world.");
		this.loadPlayerData(player);
	},

	loadPlayerData: function(player) {
		var path = this.savePath+player.name;
		this.loadFile(path, function(e,data) {
			if (!data) player.set('location','lobby');
			else player.loadData(data);
			player.force('look');
		});
	},

	savePlayer: function(player) {
		var file = 'worlds/'+this.basePath+this.savePath+player.name+'.js';
		var dump = player.dump();
		if (!dump) return false;
		var json = JSON.encode(dump);
		fs.writeFile(file, json, function (e) {
  			if (e) log_error(e);
			player.send("Game data saved.");
			player.fireEvent('save');
		});
	},

	removePlayer: function(player) {
		delete(this.players[player.name.toLowerCase()]);
		this.announce(player.name+" has left the world.");
	},

	getPlayer: function(name) {
		return this.players[name.toLowerCase()] || false;
	},

	announce: function(message) {
		Object.each(this.players, function(player) {
			player.send(message);
		});
	},
	
	getRoom: function(path) {
		if (!path) return;
		var that = this;
		if (!this.rooms[path]) {
			var file = this.roomPath+path;
			this.loadFile(file, function(e,room) {
				that.rooms[path] = new room(that);
				that.rooms[path].path = path;
			}, {'sync':true});
		} return this.rooms[path];
	},

	getCommand: function(command) {
		if (!command) return;
		var that = this;
		if (!this.commands[command]) {
			var path = 'engine/'+this.commandPath+command;
			this.loadFile(path, function(e,com) {
				that.commands[command] = new com(that);
				that.commands[command].path = path;
			}, {'sync':true, 'rootPath':true});
		} return this.commands[command];
	},

	/**
	 * Target is optional.  In the event of a conversation, the target is
	 * the NPC being conversed with.
	 */
	enterMenu: function(name, player, target) {
		if (!name) return;
		var that = this;
		if (!this.menus[name]) {
			var path;
			//If there's a target, we'll assume it's a conversation.
			if (target) path = this.conversationPath+name;
			else path = this.menuPath+name;
			require('worlds/discoworld/'+path+'.js');
			this.loadFile(path, function(e,menu) {
				sys.puts(menu);
				if (e) log_error(e);
				if (!menu) return;
				that.menus[name] = menu;
				player.enterMenu(menu, target);
			});
		} else {
			player.enterMenu(this.menus[name], target);
		}
	},

	loadItem: function(path) {
		if (!path) return;
		var that = this;
		if (!this.items[path]) {
			var file = this.itemPath+path;
			this.loadFile(file, function(e,item) {
				item.implement({'path':path});
				that.items[path] = item;
			}, {'sync':true});
		} 
		if (this.items[path]) return new this.items[path]();
		return false;
	},

	loadNPC: function(path) {
		if (!path) return;
		if (!this.npcs[path]) {
			var file = this.npcPath+path;
			var that = this;
			if (!this.npcs[path]) {
				this.loadFile(file, function(e,item) {
					item.implement({'path':path});
					that.npcs[path] = item;
				}, {'sync':true});
			} 
		}
		if (!this.npcs[path]) return false;
		var npc   = new this.npcs[path]();
		npc.path  = path;
		npc.world = this;
		return npc;
	},

	/** 
	 * I'm putting this function last because it's the ugliest.
	 */
	loadFile: function(path, callback, opts) {
		//Stuff that will make us not want to load files.
		if (path.match(/[^A-Za-z0-9\/-_.]/))  return;
		if (this.failedFiles.contains(path)) return;

		opts = opts || {};
		var file = 'worlds/'+this.basePath+path+'.js';
		if (opts.rootPath) file = path+'.js';
		sys.puts("Loading file: "+file);
		var handleData = function(e,raw) {
			data = false;
			if (e) log_error(e);
			var e = false;
			if (!raw) {
				e = "Failed to load file: "+file;
				this.failedFiles.push(path);
				log_error(e);
			} else {
				try { eval('data='+raw); }
				catch (e) { e = e; }
			}
			callback(e, data);
		};
		if (opts.sync) {
			try {
				var data = fs.readFileSync(file);
			} catch (e) {
				return false;
			}
			return handleData(false,data);
		} else {
			fs.readFile(file, handleData);
		}
	}

});
