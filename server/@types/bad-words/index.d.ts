declare module 'bad-words' {
  class Filter {
    constructor();
    isProfane(value: string): boolean;
  }
  export = Filter;
}
