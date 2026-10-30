export const GROUPS = {
  back:{id:'back',name:'Back',short:'Back',blurb:'Lats and mid-back'},
  arms:{id:'arms',name:'Arms',short:'Arms',blurb:'Biceps and triceps'},
  shoulders:{id:'shoulders',name:'Shoulders',short:'Shoulders',blurb:'Front, side and rear delts'},
  glutes:{id:'glutes',name:'Glutes',short:'Glutes',blurb:'Firm, rounded glutes'},
  legs:{id:'legs',name:'Legs',short:'Legs',blurb:'Hamstrings and quads'},
  core:{id:'core',name:'Core & Waist',short:'Core',blurb:'Trunk control, waist'}
};

export const GROUP_ORDER = ['back','arms','shoulders','glutes','legs','core'];

export const EQUIP = [
  {id:'cable',name:'Cable machines'},
  {id:'machine',name:'Selectorised machines'},
  {id:'smith',name:'Smith machine'},
  {id:'dumbbell',name:'Dumbbells'},
  {id:'barbell',name:'Barbell'},
  {id:'floor',name:'Floor work'},
  {id:'other',name:'Other equipment'}
];

export const EX = [
  {id:'lat-pulldown',g:'back',name:'Lat pulldown',sets:3,reps:[8,12],unit:'reps',cue:'Chest tall, pull elbows down to your ribs.',tags:['cable'],heavy:false},
  {id:'seated-row',g:'back',name:'Seated cable row',sets:3,reps:[10,12],unit:'reps',cue:'Squeeze shoulder blades together, no leaning back.',tags:['cable'],heavy:false},
  {id:'chest-row',g:'back',name:'Chest-supported row',sets:3,reps:[10,12],unit:'reps',cue:'Chest on the pad, pull elbows past your torso.',tags:['machine'],heavy:false},
  {id:'reverse-pec',g:'back',name:'Reverse pec deck',sets:3,reps:[12,15],unit:'reps',cue:'Go light, lead with elbows, pause at the back.',tags:['machine'],heavy:false},
  {id:'hip-thrust',g:'glutes',name:'Hip thrust machine',sets:3,reps:[8,12],unit:'reps',cue:'Ribs down, drive through heels, squeeze at the top.',tags:['machine'],heavy:true},
  {id:'hip-abduction',g:'glutes',name:'Hip abduction machine',sets:3,reps:[12,15],unit:'reps',cue:'Sit tall, press knees out, control the return.',tags:['machine'],heavy:false},
  {id:'glute-kickback',g:'glutes',name:'Cable glute kickback',sets:3,reps:[12,15],unit:'reps',note:'each leg',cue:'Slight hinge, kick back and squeeze. No swinging.',tags:['cable'],heavy:false},
  {id:'glute-press',g:'glutes',name:'Glute-focused leg press',sets:3,reps:[10,12],unit:'reps',cue:'Feet high and wide, push through your heels.',tags:['machine'],heavy:true},
  {id:'leg-curl',g:'legs',name:'Seated leg curl',sets:3,reps:[10,12],unit:'reps',cue:'Pad snug above heels, curl smoothly, lower slowly.',tags:['machine'],heavy:false},
  {id:'leg-press',g:'legs',name:'Leg press',sets:3,reps:[10,12],unit:'reps',cue:'Feet shoulder-width, knees track toes, never lock out.',tags:['machine'],heavy:true},
  {id:'leg-ext',g:'legs',name:'Leg extension',sets:3,reps:[12,15],unit:'reps',cue:'Pause one second at the top, lower slowly.',tags:['machine'],heavy:false},
  {id:'smith-squat',g:'legs',name:'Smith machine squat',sets:3,reps:[8,10],unit:'reps',cue:'Feet slightly forward, sit down between your hips.',tags:['smith'],heavy:true},
  {id:'dead-bug',g:'core',name:'Dead bug',sets:3,reps:[8,10],unit:'reps',note:'each side',bw:true,cue:'Low back flat, move opposite arm and leg slowly.',tags:['floor'],heavy:false},
  {id:'plank',g:'core',name:'Plank',sets:3,reps:[30,45],unit:'sec',bw:true,cue:'Squeeze glutes and abs, one line from head to heels.',tags:['floor'],heavy:false},
  {id:'pallof',g:'core',name:'Pallof press',sets:3,reps:[10,12],unit:'reps',note:'each side',cue:'Stand side-on, press out and resist the cable.',tags:['cable'],heavy:false},
  {id:'cable-crunch',g:'core',name:'Cable crunch',sets:3,reps:[12,15],unit:'reps',cue:'Round your spine down, hips still, exhale as you crunch.',tags:['cable'],heavy:false},
  {id:'dumbbell-curl',g:'arms',name:'Dumbbell biceps curl',sets:3,reps:[10,12],unit:'reps',cue:'Keep elbows close to your sides and lower the weights slowly.',tags:['dumbbell'],heavy:false},
  {id:'hammer-curl',g:'arms',name:'Dumbbell hammer curl',sets:3,reps:[10,12],unit:'reps',cue:'Keep palms facing each other and avoid swinging your body.',tags:['dumbbell'],heavy:false},
  {id:'triceps-pushdown',g:'arms',name:'Cable triceps pushdown',sets:3,reps:[10,12],unit:'reps',cue:'Keep elbows tucked by your sides as you straighten your arms.',tags:['cable'],heavy:false},
  {id:'overhead-triceps-extension',g:'arms',name:'Cable overhead triceps extension',sets:3,reps:[10,12],unit:'reps',cue:'Keep elbows pointing forward and use a comfortable range of motion.',tags:['cable'],heavy:false},
  {id:'machine-shoulder-press',g:'shoulders',name:'Machine shoulder press',sets:3,reps:[8,12],unit:'reps',cue:'Keep your back supported and press smoothly without locking your elbows.',tags:['machine'],heavy:true},
  {id:'dumbbell-lateral-raise',g:'shoulders',name:'Dumbbell lateral raise',sets:3,reps:[12,15],unit:'reps',cue:'Use light weights, raise slightly forward of your sides, and stop around shoulder height.',tags:['dumbbell'],heavy:false},
  {id:'cable-face-pull',g:'shoulders',name:'Cable face pull',sets:3,reps:[12,15],unit:'reps',cue:'Pull the rope toward eye level with elbows high, then return with control.',tags:['cable'],heavy:false}
];

export const EXMAP = Object.fromEntries(EX.map(e=>[e.id,e]));

/* Custom exercises live in state.custom and are mirrored into EX/EXMAP so every screen sees them. */
export function syncCustom(list){
  for(let i=EX.length-1;i>=0;i--) if(EX[i].custom) EX.splice(i,1);
  Object.keys(EXMAP).forEach(k=>{ if(EXMAP[k].custom) delete EXMAP[k]; });
  (list||[]).forEach(c=>{ if(EXMAP[c.id]) return; EX.push(c); EXMAP[c.id]=c; });
}

export function cleanCustom(c){
  if(!c||typeof c.id!=='string'||typeof c.name!=='string'||!c.name.trim()||!GROUPS[c.g]) return null;
  const lo=parseInt(c.reps&&c.reps[0]), hi=parseInt(c.reps&&c.reps[1]);
  if(!(lo>=1&&hi>=lo&&hi<=999)) return null;
  const sets=parseInt(c.sets);
  return {id:c.id,custom:true,g:c.g,name:c.name.trim().slice(0,40),sets:Math.max(1,Math.min(6,isFinite(sets)?sets:3)),reps:[lo,hi],
    unit:c.unit==='sec'?'sec':'reps',cue:String(c.cue||'').slice(0,140),tags:Array.isArray(c.tags)&&c.tags.length?[String(c.tags[0])]:['other'],heavy:false,bw:!!c.bw};
}

export const CARDIO_TYPES=[
  {id:'elliptical',name:'Elliptical',min:20,cue:'Stand tall, push and pull with the handles, steady pace.'},
  {id:'stairmaster',name:'Stair master',min:15,cue:'Stand tall, light touch on the rails, press through your whole foot.'},
  {id:'incline',name:'Incline walk',min:10,cue:'Easy incline, conversational pace, no leaning on the rails.'},
  {id:'bike',name:'Stationary bike',min:15,cue:'Seat at hip height, smooth pedalling, shoulders loose.'},
  {id:'rower',name:'Rowing machine',min:10,cue:'Legs first, then lean back, then pull. Reverse on the way in.'}
];

export const CARDIO_MINS=[10,15,20,30,45];

export const cardioOf=id=>CARDIO_TYPES.find(c=>c.id===id)||CARDIO_TYPES[0];

export const WARMUP_MIN = 5, MIN_PER_SET = 2.4, STEP_KG = 2.5;

export const POSES = {
 'lat-pulldown':{h:[30,13],b:['M30 17V31L42 33V45','M30 21L22 8','M30 21L40 8'],e:['M16 8H46','M31 2V8','M22 31H44']},
 'seated-row':{h:[22,13],b:['M22 17V31L38 32V44','M22 22L40 25'],e:['M40 25H60','M60 20V30','M14 33H36']},
 'chest-row':{h:[18,15],b:['M21 18L36 28L46 32L48 44','M30 24V40'],e:['M12 18L32 36','M28 36V46','M34 46H56']},
 'reverse-pec':{h:[32,12],b:['M32 16V31L42 33V44','M32 20H14','M32 20H50'],e:['M26 15V29','M22 31H44']},
 'hip-thrust':{h:[10,27],b:['M14 30L32 22L44 28L45 42'],e:['M6 33H22V45','M4 46H60','M26 18H40']},
 'hip-abduction':{h:[32,10],b:['M32 14V29L16 36L12 45','M32 29L48 36L52 45'],e:['M22 29H42','M6 38L10 40','M58 38L54 40']},
 'glute-kickback':{h:[26,10],b:['M26 14L28 30V44','M28 30L46 36','M26 19L17 23'],e:['M17 23H8V45','M4 47H60']},
 'glute-press':{h:[10,30],b:['M13 32L26 38L40 26L48 16'],e:['M4 40L22 47','M48 8L56 34','M10 47H58']},
 'leg-curl':{h:[24,10],b:['M24 14V30L42 31L38 45'],e:['M18 32H44','M40 27V35','M10 47H58']},
 'leg-press':{h:[10,28],b:['M13 30L28 38L42 28L52 24'],e:['M54 12L60 38','M4 42L26 48']},
 'leg-ext':{h:[22,10],b:['M22 14V30L38 31L54 24'],e:['M16 32H40','M50 18L58 30']},
 'smith-squat':{h:[32,8],b:['M32 12V26L42 34L38 44','M32 26L24 36L30 44'],e:['M18 14H46','M20 3V47','M44 3V47']},
 'dead-bug':{h:[8,35],b:['M12 37H32','M18 37V22','M32 37L40 26L50 27','M32 37L52 40'],e:['M4 44H60']},
 'plank':{h:[9,24],b:['M13 27L50 36','M16 28V40','M50 36V44'],e:['M4 46H60']},
 'pallof':{h:[28,10],b:['M28 14V30L24 44','M28 30L33 44','M28 20L46 20'],e:['M46 20H62','M62 14V28']},
 'cable-crunch':{h:[28,20],b:['M30 24L36 34H48V46','M36 34L24 26'],e:['M20 4L26 22','M10 47H58']},
 'dumbbell-curl':{h:[32,8],b:['M32 12V28','M32 18L22 25L24 34','M32 18L42 25L40 34','M24 34V42','M40 34V42'],e:['M20 33H28','M36 33H44']},
 'hammer-curl':{h:[32,8],b:['M32 12V28','M32 18L22 25L23 34','M32 18L42 25L41 34','M23 34V42','M41 34V42'],e:['M20 36V42','M44 36V42']},
 'triceps-pushdown':{h:[32,8],b:['M32 12V28','M32 18L22 24L24 38','M32 18L42 24L40 38','M24 38V44','M40 38V44'],e:['M20 44H28','M36 44H44','M20 17H44','M20 17V24']},
 'overhead-triceps-extension':{h:[32,8],b:['M32 12V28','M32 18L22 12L24 2','M32 18L42 12L40 2','M24 2L32 10','M40 2L32 10','M32 28L26 44','M32 28L38 44'],e:['M24 2H40']},
 'machine-shoulder-press':{h:[32,8],b:['M32 12V30','M32 19L22 12V3','M32 19L42 12V3','M32 30L25 44','M32 30L39 44'],e:['M18 3V20','M46 3V20','M18 3H46','M24 26H40']},
 'dumbbell-lateral-raise':{h:[32,8],b:['M32 12V30','M32 19L18 10','M32 19L46 10','M18 10L12 6','M46 10L52 6','M32 30L25 44','M32 30L39 44'],e:['M9 3V9','M55 3V9']},
 'cable-face-pull':{h:[32,8],b:['M32 12V30','M32 19L22 12L27 8','M32 19L42 12L37 8','M32 30L25 44','M32 30L39 44'],e:['M10 8H25','M25 8L29 11','M29 11L26 14']},
 'incline':{h:[28,10],b:['M28 14L30 28L22 40','M30 28L40 38L44 46','M29 18L38 22','M29 18L20 24'],e:['M6 48L58 38']},
 'elliptical':{h:[30,10],b:['M30 14V30','M30 30L24 44','M30 30L38 42','M30 20L18 24','M30 20L42 24'],e:['M14 47H52','M16 24V8','M44 24V8','M20 44L46 38']},
 'stairmaster':{h:[24,10],b:['M24 14V30L20 44','M24 30L32 36','M24 20L36 22'],e:['M36 22V34','M30 47H58','M34 47V40H44V33H54V26']},
 'bike':{h:[30,10],b:['M30 14L36 28L24 38','M36 28L48 36','M31 18L44 22'],e:['M16 47H54','M22 38H48','M44 22V28']},
 'rower':{h:[34,16],b:['M34 20L26 32L12 36','M26 32L40 40','M34 22L50 28'],e:['M6 44H58','M44 28V38','M16 38V44']}
};
