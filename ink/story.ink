

=== start ===
It's 9 PM on a Thursday. Rain pelts the old tin roof of the Blackwood Bar. You wipe down the counter and glance at the dusty neon sign flickering in the window.
The woods are quiet tonight... too quiet. You wonder what kind of souls the storm will blow in.
-> first_guest

=== first_guest ===
A figure pushes open the door, trailing rainwater. A weary traveler, by the look of him, in a crumpled coat and fedora.
"Cold night, huh?" he mutters, meeting your eyes briefly.
*   "Warm yourself up. What'll it be?" -> order1
*   Nod and wait for his order. -> order1

=== order1 ===
"Martini, thanks. Extra dry." #RECIPE: Martini
Mixing a classic martini... #INGREDIENT: gin -1 #INGREDIENT: vermouth -1
You stir and strain it into a chilled glass, sliding it over.
"Cheers," he says, lifting it to his lips.
He downs the martini quietly, a faint smile on his tired face.
"I'm back on the road after this," he sighs, patting his pockets.
He leaves a few bills on the counter. #TIP: 5 #SCORE: 1
"Thanks, friend," he nods, and disappears back into the storm.
#EVENT: guest_arrive
-> second_guest

=== second_guest ===
A moment later, another patron stomps in, shaking off an umbrella.
A gruff lumberjack type, red-cheeked from the cold.
"Bourbon. Neat," he barks, slapping a ten on the bar. 
"Make it a double if you've got it."
You reach for the whiskey bottle.
The amber liquid swirls into the glass. #RECIPE: Whiskey_neat
It's the last of the whiskey – the bottle runs dry. #INGREDIENT: whiskey -1
He shoots it back in one go and grunts in approval.
"Keep the change," he mumbles, tossing a couple of crumpled bills. #TIP: 3 #SCORE: 1
He lingers for a minute, staring at the empty glass, then shoves away from the bar and exits.
10:00 PM. The neon sign buzzes as more lights flicker on – Happy Hour. #SHIFT: happyHour
Right on cue, a thunderclap shakes the bar. The lights flicker ominously. #EVENT: flicker
The next hour brings a handful of locals, nothing notable – beers and small talk. You handle them with routine ease.
-> third_guest

=== third_guest ===
Close to midnight, a tall man in a trench coat appears, dripping water on your floorboards. A detective, maybe, judging by the loose tie and weary eyes.
He settles into a stool under the dim lamp.
"Give me a whiskey, neat," he says quietly, not looking up.
You freeze, remembering the empty whiskey bottle.
*   Offer him a rum instead. -> offer_rum
*   Apologize for being out of whiskey. -> no_whiskey

=== offer_rum ===
"We're out of whiskey, but how about a dark rum? On the house."
He raises an eyebrow, then nods slowly. "Fine."
You pour a measure of aged rum and slide it over. #RECIPE: Rum_neat #INGREDIENT: rum -1
He takes a sip. "Not bad," he concedes, a hint of a smirk on his face.
He leaves a small tip, despite it being on the house. #TIP: 2 #SCORE: 1
"Good night," he says, tipping his hat as he departs.
-> closing_time

=== no_whiskey ===
"I'm sorry, we're fresh out of whiskey," you admit.
He grimaces. "Figures." Without another word, he turns on his heel and walks back out into the rain.
The door bangs shut. You exhale, feeling you just lost a customer. #SCORE: -1
-> closing_time

=== closing_time ===
12:00 AM. Midnight. Last call has come and gone. #SHIFT: closing
You wipe down the bar one last time and flip the sign to "Closed".
A delivery truck pulls up outside as you lock up – a late order of supplies.
Two burly men lug crates into your storeroom, replenishing your stock for tomorrow. #INGREDIENT: whiskey +5 #EVENT: restock
The bar is quiet again, the only sound the hum of the refrigerator and the patter of rain.
It's been a long night, but a decent one.

You count your earnings and reflect on the night's work.
-> END
