/** @param {Number} num */
export const exp = (pow=1)=> (10 ** pow)
export const round = (num, pow=1)=> Math.round(num * exp(pow))/exp(pow);
export const floor = (num, pow=1)=> Math.floor(num * exp(pow))/exp(pow);
export const ceil = (num, pow=1)=> Math.ceil(num * exp(pow))/exp(pow);
export const toExp = (num, place)=>{
  let pow = Math.floor(Math.log10(num));
	place = 10**place;
  return (Math.floor(num/(10**pow)*place)/place + `e${pow}`);
}
export const sci = (num, place=1)=> num >= 1000 ? toExp(num, place).replace("+", "") : round(num);
