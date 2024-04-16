register("worldLoad", (its) => {
  let x, y
  x = 5

  y = { apple: (x, y, z) => 19 }

  register("worldLoad2", (its) => {
    x = 10
  })

  foo()
})

register("click", (its) => {
  alert("You clicked me!")
})
