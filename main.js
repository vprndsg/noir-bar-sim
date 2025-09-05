import { World, System, Component, TagComponent, Types } from "https://ecsyjs.github.io/ecsy/build/ecsy.module.js";

// Pull the Behavior3JS and InkJS singletons from the window object.
// These libraries are loaded via script tags in index.html and attach themselves
// to `window`. In an ES module, top-level globals like `b3` and `inkjs`
// are not automatically available, so we alias them here.
const b3 = window.b3;
const inkjs = window.inkjs;

// This file sets up the ECS world, loads a Behavior3JS tree and Ink story,
// and ties everything together for the noir bar sim. NPCs are ECS entities
// with components for AI state and a reference to a BT blackboard. A global
// Inventory and Score entity hold shared state. The UI updates via systems.

// ========== 1. ECS Components ==========
class GuestComponent extends Component {}
GuestComponent.schema = {
  blackboard: { type: Types.Ref, default: null },
  ordered: { type: Types.Boolean, default: false },
  served: { type: Types.Boolean, default: false },
  shouldLeave: { type: Types.Boolean, default: false }
};

class InventoryComponent extends Component {}
InventoryComponent.schema = {
  items: { type: Types.Ref, default: null }
};

class ScoreComponent extends Component {}
ScoreComponent.schema = {
  tips: { type: Types.Number, default: 0 },
  score: { type: Types.Number, default: 0 }
};

class Leaving extends TagComponent {}

// ========== 2. ECS Systems ==========

class AISystem extends System {
  execute(delta, time) {
    this.queries.guests.results.forEach(entity => {
      const guest = entity.getComponent(GuestComponent);
      if (!guest) return;
      GuestBehaviorTree.tick(entity, guest.blackboard);
      if (guest.shouldLeave) {
        entity.addComponent(Leaving);
      }
    });
  }
}
AISystem.queries = {
  guests: { components: [GuestComponent] }
};

class GuestRemovalSystem extends System {
  execute() {
    this.queries.leavers.results.forEach(entity => {
      this.world.removeEntity(entity);
    });
  }
}
GuestRemovalSystem.queries = {
  leavers: { components: [Leaving] }
};

class InventoryUISystem extends System {
  execute() {
    const invEntity = this.queries.inventory.results[0];
    if (!invEntity) return;
    const invData = invEntity.getComponent(InventoryComponent).items;
    const invList = document.getElementById("inventory");
    invList.innerHTML = "";
    for (let item in invData) {
      const li = document.createElement("li");
      li.textContent = `${item.charAt(0).toUpperCase() + item.slice(1)}: ${invData[item]}`;
      if (invData[item] === 0) {
        li.classList.add("out");
        li.textContent += " (OUT)";
      } else if (invData[item] <= 1) {
        li.classList.add("low");
      }
      invList.appendChild(li);
    }
  }
}
InventoryUISystem.queries = {
  inventory: { components: [InventoryComponent] }
};

class ScoreUISystem extends System {
  execute() {
    const scoreEntity = this.queries.score.results[0];
    if (!scoreEntity) return;
    const scoreComp = scoreEntity.getComponent(ScoreComponent);
    document.getElementById("tips").textContent = scoreComp.tips;
    document.getElementById("score").textContent = scoreComp.score;
  }
}
ScoreUISystem.queries = {
  score: { components: [ScoreComponent] }
};

// ========== 3. Initialize ECS World ==========
const world = new World();
world.registerComponent(GuestComponent)
     .registerComponent(InventoryComponent)
     .registerComponent(ScoreComponent)
     .registerComponent(Leaving);
world.registerSystem(AISystem)
     .registerSystem(GuestRemovalSystem)
     .registerSystem(InventoryUISystem)
     .registerSystem(ScoreUISystem);

const inventoryEntity = world.createEntity().addComponent(InventoryComponent);
const scoreEntity = world.createEntity().addComponent(ScoreComponent);

let Recipes = {};
let Settings = {};
let GuestBehaviorTree = null;
let story = null;

// ========== 4. Load initial data ==========
async function loadInitialData() {
  const stockData = await (await fetch("data/stock.json")).json();
  const recipeData = await (await fetch("data/recipes.json")).json();
  const settingsData = await (await fetch("data/settings.json")).json();
  inventoryEntity.getMutableComponent(InventoryComponent).items = stockData;
  Recipes = recipeData;
  Settings = settingsData;
}

// ========== 5. Behavior Tree Setup ==========
function loadBehaviorTree(json) {
  GuestBehaviorTree = new b3.BehaviorTree();
  const ConditionShouldLeave = b3.Class(b3.Condition, {
    name: "ConditionShouldLeave",
    tick: function(tick) {
      const guestComp = tick.target.getComponent(GuestComponent);
      return guestComp && guestComp.shouldLeave ? b3.SUCCESS : b3.FAILURE;
    }
  });
  const ConditionNotOrdered = b3.Class(b3.Condition, {
    name: "ConditionNotOrdered",
    tick: function(tick) {
      const guestComp = tick.target.getComponent(GuestComponent);
      return guestComp && !guestComp.ordered ? b3.SUCCESS : b3.FAILURE;
    }
  });
  const ConditionOrderedNotServed = b3.Class(b3.Condition, {
    name: "ConditionOrderedNotServed",
    tick: function(tick) {
      const guestComp = tick.target.getComponent(GuestComponent);
      return guestComp && guestComp.ordered && !guestComp.served ? b3.SUCCESS : b3.FAILURE;
    }
  });
  const ConditionServedNotDone = b3.Class(b3.Condition, {
    name: "ConditionServedNotDone",
    tick: function(tick) {
      const guestComp = tick.target.getComponent(GuestComponent);
      return guestComp && guestComp.served && !guestComp.shouldLeave ? b3.SUCCESS : b3.FAILURE;
    }
  });
  const ActionOrderDrink = b3.Class(b3.Action, {
    name: "ActionOrderDrink",
    tick: function(tick) {
      const guestComp = tick.target.getMutableComponent(GuestComponent);
      if (!guestComp) return b3.FAILURE;
      guestComp.ordered = true;
      return b3.SUCCESS;
    }
  });
  const ActionSetLeaveImpatient = b3.Class(b3.Action, {
    name: "ActionSetLeaveImpatient",
    tick: function(tick) {
      const guestComp = tick.target.getMutableComponent(GuestComponent);
      if (guestComp) {
        guestComp.shouldLeave = true;
      }
      return b3.SUCCESS;
    }
  });
  const ActionFinishDrink = b3.Class(b3.Action, {
    name: "ActionFinishDrink",
    tick: function(tick) {
      const guestComp = tick.target.getMutableComponent(GuestComponent);
      if (guestComp) {
        guestComp.shouldLeave = true;
      }
      return b3.SUCCESS;
    }
  });
  const ActionLeave = b3.Class(b3.Action, {
    name: "ActionLeave",
    tick: function(tick) {
      return b3.SUCCESS;
    }
  });
  const customNodes = {
    "ConditionShouldLeave": ConditionShouldLeave,
    "ConditionNotOrdered": ConditionNotOrdered,
    "ConditionOrderedNotServed": ConditionOrderedNotServed,
    "ConditionServedNotDone": ConditionServedNotDone,
    "ActionOrderDrink": ActionOrderDrink,
    "ActionSetLeaveImpatient": ActionSetLeaveImpatient,
    "ActionFinishDrink": ActionFinishDrink,
    "ActionLeave": ActionLeave
  };
  GuestBehaviorTree.load(json, customNodes);
}

// ========== 6. Ink Integration ==========
const storyOutput = document.getElementById("storyOutput");
const choicesElem = document.getElementById("choices");

function handleTags(tags) {
  tags.forEach(tag => {
    const parts = tag.split(":");
    const tagKey = parts[0].trim();
    const tagValue = parts.length > 1 ? parts.slice(1).join(":").trim() : null;
    switch (tagKey.toUpperCase()) {
      case "INGREDIENT": {
        if (tagValue) {
          const [ingName, qtyStr] = tagValue.split(" ");
          let qty = parseInt(qtyStr);
          const inv = inventoryEntity.getMutableComponent(InventoryComponent).items;
          if (!(ingName in inv)) {
            inv[ingName] = 0;
          }
          if (isNaN(qty)) break;
          if (qty < 0) {
            inv[ingName] = Math.max(0, inv[ingName] + qty);
          } else {
            inv[ingName] += qty;
          }
        }
        break;
      }
      case "RECIPE": {
        if (tagValue) {
          const drinkName = tagValue;
          const recipe = Recipes[drinkName];
          if (recipe) {
            for (let ing in recipe.ingredients) {
              const inv = inventoryEntity.getMutableComponent(InventoryComponent).items;
              if (inv[ing] !== undefined) {
                inv[ing] = Math.max(0, inv[ing] - recipe.ingredients[ing]);
              }
            }
          }
        }
        break;
      }
      case "EVENT": {
        if (tagValue) {
          const gameDiv = document.getElementById("game");
          if (tagValue === "flicker") {
            gameDiv.classList.add("flicker");
            setTimeout(() => gameDiv.classList.remove("flicker"), 800);
          } else if (tagValue === "guest_arrive") {
            spawnGuest();
          }
        }
        break;
      }
      case "SHIFT": {
        if (tagValue) {
          if (tagValue === "happyHour") {
            console.log("Happy Hour started");
          } else if (tagValue === "closing") {
            console.log("Closing time");
          }
        }
        break;
      }
      case "TIP": {
        const tipAmount = parseInt(tagValue);
        if (!isNaN(tipAmount)) {
          const scoreComp = scoreEntity.getMutableComponent(ScoreComponent);
          scoreComp.tips += tipAmount;
          scoreComp.score += tipAmount;
        }
        break;
      }
      case "SCORE": {
        const pts = parseInt(tagValue);
        if (!isNaN(pts)) {
          const scoreComp = scoreEntity.getMutableComponent(ScoreComponent);
          scoreComp.score += pts;
        }
        break;
      }
      default:
        console.log("Unknown tag:", tag);
    }
  });
}

function displayLine(text) {
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  storyOutput.appendChild(paragraph);
  storyOutput.scrollTop = storyOutput.scrollHeight;
}

function showChoices() {
  choicesElem.innerHTML = "";
  story.currentChoices.forEach(choice => {
    const button = document.createElement("button");
    button.textContent = choice.text;
    button.addEventListener("click", () => {
      story.ChooseChoiceIndex(choice.index);
      choicesElem.innerHTML = "";
      continueStory();
    });
    choicesElem.appendChild(button);
  });
}

function continueStory() {
  while (story.canContinue) {
    const text = story.Continue().trim();
    const tags = story.currentTags ? [...story.currentTags] : [];
    if (text) displayLine(text);
    if (tags.length > 0) handleTags(tags);
    if (story.currentChoices.length > 0) {
      showChoices();
      break;
    }
  }
  if (!story.canContinue && story.currentChoices.length === 0) {
    console.log("Story finished");
  }
}

function spawnGuest() {
  const guestEntity = world.createEntity();
  const blackboard = new b3.Blackboard();
  guestEntity.addComponent(GuestComponent, { blackboard: blackboard });
  return guestEntity;
}

async function startGame() {
  await loadInitialData();
  const inkSource = await (await fetch("ink/story.ink")).text();
  let compiled;
  try {
    compiled = new inkjs.Compiler(inkSource).Compile();
  } catch (e) {
    console.error("Failed to compile Ink story", e);
    return;
  }
  story = new inkjs.Story(compiled);
  const btJson = await (await fetch("ai/GuestBehavior.json")).json();
  loadBehaviorTree(btJson);
  continueStory();
  const tickMs = 1000;
  function loop() {
    world.execute(tickMs, performance.now());
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
startGame();
