/** @param {Number} num */
export const exp = (pow=1)=> (10 ** pow)
export const round = (num, pow=1)=> Math.round(num * exp(pow))/exp(pow);
export const sci = (num, place=1)=> num >= 1000 ? num.toExponential(place).replace("+", "") : round(num);
