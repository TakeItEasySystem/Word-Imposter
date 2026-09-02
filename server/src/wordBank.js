export const WORD_SETS = [
  {
    category: "Food & Delicacies",
    words: ["Pizza", "Burger", "Taco"],
    questions: [
      "Where or on what occasion are people most likely to enjoy this?",
      "What is the messiest or most distinct part about eating this?"
    ]
  },
  {
    category: "Food & Delicacies",
    words: ["Ice Cream", "Frozen Yogurt", "Popsicle"],
    questions: [
      "What happens if you leave this out on a hot sunny day?",
      "What sensation or temperature do you immediately feel when consuming it?"
    ]
  },
  {
    category: "Beverages",
    words: ["Coffee", "Tea", "Hot Chocolate"],
    questions: [
      "At what time of day or during what weather do people crave this the most?",
      "What is the first aroma or taste you associate with it?"
    ]
  },
  {
    category: "Animals",
    words: ["Cat", "Tiger", "Cheetah"],
    questions: [
      "How would this animal react if you tried to pet or hug it?",
      "Where does this creature spend most of its active time?"
    ]
  },
  {
    category: "Animals",
    words: ["Penguin", "Dolphin", "Seal"],
    questions: [
      "What environment or climate does this animal thrive in?",
      "What is the primary way this creature moves around when escaping danger?"
    ]
  },
  {
    category: "Animals",
    words: ["Eagle", "Bat", "Owl"],
    questions: [
      "At what time of day or night is this creature most active and dangerous?",
      "What gives this animal its distinct hunting advantage?"
    ]
  },
  {
    category: "Vehicles & Transport",
    words: ["Bicycle", "Motorcycle", "Skateboard"],
    questions: [
      "What safety equipment should you definitely wear when using this?",
      "How does someone get this vehicle to stop quickly?"
    ]
  },
  {
    category: "Vehicles & Transport",
    words: ["Helicopter", "Airplane", "Hot Air Balloon"],
    questions: [
      "How high into the sky does this typically travel?",
      "How many passengers or crew can typically ride in it comfortably?"
    ]
  },
  {
    category: "Everyday Objects",
    words: ["Smartphone", "Laptop", "Smartwatch"],
    questions: [
      "Where do you usually keep or carry this during your day?",
      "What is the most annoying thing that can happen while using it?"
    ]
  },
  {
    category: "Everyday Objects",
    words: ["Sunglasses", "Umbrella", "Sunscreen"],
    questions: [
      "What kind of extreme weather or outdoor condition calls for this?",
      "What is the biggest downside if you accidentally forget it at home?"
    ]
  },
  {
    category: "Music & Entertainment",
    words: ["Acoustic Guitar", "Electric Guitar", "Violin"],
    questions: [
      "What kind of music genre or performance is this instrument most famous for?",
      "How is sound physically produced and amplified by this instrument?"
    ]
  },
  {
    category: "Places & Buildings",
    words: ["Library", "Museum", "Cinema"],
    questions: [
      "What is the strict unspoken rule for behavior inside this place?",
      "What is the main reason a group of friends would visit this place together?"
    ]
  },
  {
    category: "Places & Buildings",
    words: ["Hospital", "Pharmacy", "Clinic"],
    questions: [
      "What is the general mood or emotion of people entering this place?",
      "What is a typical item or scent you will immediately notice upon entering?"
    ]
  },
  {
    category: "Clothing & Accessories",
    words: ["Sneakers", "High Heels", "Boots"],
    questions: [
      "In what terrain or event would wearing this be a terrible mistake?",
      "How comfortable do your feet feel after wearing this for 8 hours?"
    ]
  },
  {
    category: "Superheroes & Fantasy",
    words: ["Superman", "Batman", "Spider-Man"],
    questions: [
      "What is this hero's biggest weakness or vulnerability?",
      "How does this hero commute through their city to fight crime?"
    ]
  },
  {
    category: "Nature & Elements",
    words: ["Volcano", "Bonfire", "Campfire"],
    questions: [
      "How close can you safely stand to this before getting burned?",
      "What is the primary substance or fuel keeping this burning or active?"
    ]
  },
  {
    category: "Sports & Hobbies",
    words: ["Football / Soccer", "Basketball", "Tennis"],
    questions: [
      "What body part or equipment is primarily used to control the ball?",
      "What happens when a player scores a point or goal in this sport?"
    ]
  },
  {
    category: "Cosmetics & Care",
    words: ["Shampoo", "Body Wash", "Toothpaste"],
    questions: [
      "Where in the house is this product always used?",
      "What would happen if you accidentally swallowed or got this in your eyes?"
    ]
  },
  {
    category: "Fantasy & Magic",
    words: ["Dragon", "Phoenix", "Griffin"],
    questions: [
      "What elemental power or mythical ability is this creature famed for?",
      "Where in ancient legends does this majestic beast build its lair?"
    ]
  },
  {
    category: "Space & Cosmos",
    words: ["The Moon", "Mars", "The Sun"],
    questions: [
      "What is the extreme surface temperature or appearance like here?",
      "Could a human ever set foot on this without an advanced space suit?"
    ]
  }
];

export const FALLBACK_QUESTIONS = [
  "What is the most recognizable visual characteristic of this?",
  "How would you describe its size compared to a watermelon?",
  "If this thing made a sound, what would it sound like?",
  "Where in the world are you most likely to encounter this?",
  "What is the worst mistake someone could make with this?"
];

export function getRandomWordSet() {
  const index = Math.floor(Math.random() * WORD_SETS.length);
  return WORD_SETS[index];
}
