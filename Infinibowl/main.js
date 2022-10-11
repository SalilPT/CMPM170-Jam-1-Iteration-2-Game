title = "infinibowl";

description = `
[click] 
to bowl`;

characters = [
  `
 llll
ll l l
lll ll
llllll
llllll
 llll 
`
,
`
 ll
 ll
llll
llll
 ll 
`
];

const G = {
  WIDTH: 60,
  HEIGHT: 90,
  PINH: 15
}

options = {
   //theme: "pixel",
   viewSize: {x: G.WIDTH, y: G.HEIGHT},
   isPlayingBgm: true,
   isReplayEnabled: true,
   //seed: 100
};

function update() {
   if (!ticks) {
      player = {pos: vec(G.WIDTH * 0.5, G.HEIGHT * 0.5)};
      pin = {pos: vec(G.WIDTH * 0.5, G.HEIGHT * 0.5)};
   }

   player.pos = vec(input.pos.x, input.pos.y);
   player.pos.clamp(5, G.WIDTH-5, G.HEIGHT-10, G.HEIGHT-10);

   pin.pos.clamp(0, G.WIDTH, G.HEIGHT/2, G.HEIGHT);

   char("a", player.pos);
   box(G.WIDTH/2, G.PINH, 4, 6);
   box(G.WIDTH/2, G.PINH, 4, 6);

}  

addEventListener("load", onLoad);