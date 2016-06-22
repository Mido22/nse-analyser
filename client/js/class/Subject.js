class Subject{
  constructor(){
    this.observers = new Map();
    this.observersArray = [];
  }
  notify(context){
    this.observersArray.forEach(fn => fn(context));
    Array.from(this.observers.values()).forEach(fn => fn(context));
  }
  addObserver(fn, key){
    if(!key)
      this.observersArray.push(fn);
    else if( this.observers.has(key))
      throw new Error('Key already used');
    else
      this.observers.set(key, fn);
  }
}