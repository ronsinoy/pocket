// A small arithmetic parser. No eval or executable expressions.
export function calculate(expression){
 const input=expression.replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-').replace(/\s/g,'');
 if(!input||input.length>200)throw Error('Enter a calculation.');
 const tokens=input.match(/(?:\d+(?:\.\d*)?|\.\d+)|[()+\-*/%]/g)||[];
 if(tokens.join('')!==input)throw Error('Use numbers and arithmetic operators.');
 let pos=0;
 function atom(){let value;if(tokens[pos]==='+'){pos++;return atom();}if(tokens[pos]==='-'){pos++;return -atom();}if(tokens[pos]==='('){pos++;value=add();if(tokens[pos++]!==')')throw Error('Check the brackets.');}else{value=Number(tokens[pos++]);if(!Number.isFinite(value))throw Error('Check the calculation.');}while(tokens[pos]==='%'){pos++;value/=100;}return value;}
 function multiply(){let n=atom();while(tokens[pos]==='*'||tokens[pos]==='/'){const op=tokens[pos++],right=atom();if(op==='/'&&right===0)throw Error('Cannot divide by zero.');n=op==='*'?n*right:n/right;}return n;}
 function add(){let n=multiply();while(tokens[pos]==='+'||tokens[pos]==='-'){const op=tokens[pos++],right=multiply();n=op==='+'?n+right:n-right;}return n;}
 const result=add();if(pos!==tokens.length||!Number.isFinite(result))throw Error('Check the calculation.');return Number(result.toPrecision(12));
}
