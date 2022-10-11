title = "TITLE";

description = `
DESC
`;

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
  WIDTH: 120,
  HEIGHT: 100, 
}

options = {
   //theme: "pixel",
   viewSize: {x: G.WIDTH, y: G.HEIGHT},
   //isPlayingBgm: true,
   //isReplayEnabled: true,
   //seed: 100
};

function update() {
   if (!ticks) {
   player = {
      pos: vec(G.WIDTH * 0.5, G.HEIGHT * 0.5)};
   }

   player.pos = vec(input.pos.x, input.pos.y);
   player.pos.clamp(0, G.WIDTH, 90, 91);

   char("a", player.pos);
}  

addEventListener("load", onLoad);