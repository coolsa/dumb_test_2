define([
	'interface',
	'isoGrid',
	'codemirror',
	'codemirror/mode/htmlmixed/htmlmixed'],function(interface, isoGrid, CodeMirror, compiler){
	function running(){
		var largestZ = 0;
		$(".center")[0].style.maxHeight = $(window).height()-100 + "px";
		this.grid = [];
		for(var x=0;x<5;x++){
			this.grid[x]=[];
			for(var z=0;z<4;z++){
				if(z>largestZ)largestZ=z;
				this.grid[x][z]=[];
				for(var y=0;y<3;y++){
					this.grid[x][z][y]={
						type:"repeating",
						dir:"empty",
						line:x*5+y*25+z
					}
					if(y==0){
						this.grid[x][z][y].type="chain";
						this.grid[x][z][y].face="neg_z_cond";
					}
					if(y==1){
						this.grid[x][z][y].type="impulse";
						this.grid[x][z][y].face="pos_x_norm";
					}
					if(y==2){
						this.grid[x][z][y].type="repeating";
						this.grid[x][z][y].face="pos_y_cond";
					}
				}
			}
		}
		for(var x=0;x<3;x++){
			if(this.grid[x]==undefined)this.grid[x]=[];
			for(var z=4;z<6;z++){
				if(z>largestZ)largestZ=z;
				this.grid[x][z]=[];
				for(var y=0;y<4;y++){
					this.grid[x][z][y]={
						type:"repeating",
						dir:"empty",
						line:x*5+y*25+z
					}
					if(y==0){
						this.grid[x][z][y].type="chain";
						this.grid[x][z][y].face="neg_z_cond";
					}
					if(y==1){
						this.grid[x][z][y].type="impulse";
						this.grid[x][z][y].face="pos_x_norm";
					}
					if(y==2){
						this.grid[x][z][y].type="repeating";
						this.grid[x][z][y].face="pos_y_cond";
					}
					if(y==3){
						this.grid[x][z][y].face="neg_x_cond";
					}
				}
			}
		}
		this.iso = new isoGrid();
		this.iso.largestZ = largestZ;
		this.interface = new interface();
		this.interface.isoSize=(this.grid.length+this.grid[0][0].length);
		this.iso.render(this.grid);
		this.interface.resizeIso();
	}
	return running;
})
