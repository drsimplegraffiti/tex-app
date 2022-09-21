const person = {
  name: 'John',
  age: 30,
  greet: function () {
    console.log(
      'Hi, I am ' + this.name,
      'and I am ' + this.age + ' years old.'
    );
  },
};

console.log(person.greet());
