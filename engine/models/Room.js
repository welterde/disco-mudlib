Room = new Class({

	Extends: Base,
	Implements: Container,
	long: null,
	short: null,
	exits: {},
	desc_items: {},
	players: {},
	living: [],

	initialize: function(world) {
		this.world   = world;
		this.create();
	},

	add_living: function(path) {
		var npc = this.world.loadNPC(path);
		npc.set('room', this);
	},
	
	addPlayer: function(player) {
		this.players[player.name.toLowerCase()] = player;
	},

	addNPC: function(npc) {
		this.living.push(npc);
	},

	removePlayer: function(player) {
		delete(this.players[player.name.toLowerCase()]);
	},

	getPlayer: function(name) {
		return this.players[name.toLowerCase()] || false;
	},

	getLiving: function(name) {
		if (!name) {
			living = [];
			Object.each(this.players, function(pl) {
				living.push(pl);
			});
			this.living.each(function(l) {
				living.push(l);
			});
			return living;
		}
		var player = this.getPlayer(name);
		if (player) return player;
		var npc = null; 
		this.living.each(function(l) {
			if (!npc && l.get('aliases').contains(name)) npc = l;
		});
		return npc;
	},

	getExits: function() {
		return this.exits;
	},

	hasExit: function(exit) {
		return typeof this.exits[exit] !== 'undefined';
	},

	getDescription: function(observer) {
		if (!observer) return;
		var lines = [];
		observer.send(this.get('long'));
		var exits = [];
		Object.each(this.get('exits'), function(v,k) {
			exits.push(k);
		});
		if (exits.length==0) observer.send('There are no obvious exits.', 'exits');
		else observer.send('Exits: '+exits.join(', '), 'exits');
		var living = [];
		this.get('living').each(function(live) {
			if (live!=observer) living.push(live.get('short'));
		});
		if (living.length>0) {
			if (living.length>1) {
				var last = living.getLast();
				living[living.length-1] = 'and '+last;
				living[living.length-2] = living[living.length-2].replace(/, $/, ' ');
			}
			lines.push(living.join(', ') + (living.length>1 ? " are" : " is") + " standing here.");
		}
		var items = this.listItems();
		if (items.length>0){
			if (items.length>1) items[items.length-1] = 'and '+items.getLast();
			lines.push(items.join(', ') + (items.length>1 ? " are" : " is") + " on the ground.");
		}
		return lines;
	},

	set_short: function(short) {
		this.short = short;
	},

	set_long: function(long) {
		this.long = long;
	},

	add_exit: function(dir, loc) {
		this.exits[dir] = loc;
	},

	//add an item view inside the room desc. LPC naming style.
	add_item: function(keyword, desc, aliases) {
		this.desc_items[keyword] = desc;
		var that = this;
		Object.each(aliases, function(alias) { that.desc_items[alias] = keyword; });
	},

	getDetail: function(item) {
		return this.desc_items[item];
	},

	create: function() {
		this.set_short("Empty place")
		this.set_long("This room is broken. Pretend you didn't see it")
	}
	
});
