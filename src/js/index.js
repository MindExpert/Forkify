import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import {elements, renderLoader, clearLoader} from './views/base';




/** Global state of the app
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes
 * everytime we reload the app, the state will be empty
 */
const state = {};

/************************
*** SEARCH CONTROLLER ***
************************/
const controlSearch = async () => {
	// 1) Get query from the view
	const query = searchView.getInput(); //  TODO
	
	if (query) {
		// 2) New search object and add it to state
		state.search = new Search(query);

		// 3) Prepare UI for results
		searchView.clearInput();
		searchView.clearResults();
		renderLoader(elements.searchRes);

		try {
			// 4) Search for recepies
			await state.search.getResults();

			// 5) Render results on UI after we have gotten the results
			clearLoader();
			searchView.renderResults(state.search.result);
		} catch (error) {
			alert('Something went wrong with your Search!');
			clearLoader();
		}

		
	}
}

// event we are listening to ('submit', and call back function e => { ... } )
elements.searchForm.addEventListener('submit', e => {
	e.preventDefault();
	controlSearch();
});


elements.searchResPages.addEventListener('click', e => {
	const btn = e.target.closest('.btn-inline');
	if (btn) {
		const goToPage = parseInt(btn.dataset.goto, 10);
		searchView.clearResults();
		searchView.renderResults(state.search.result, goToPage);
	}
});


/************************
*** RECIPE CONTROLLER ***
************************/
const controlRecipe = async () => {
	// Get ID from URL
	const id = window.location.hash.replace('#', ''); 

	if(id) {
		// Prepare UI for changes
		recipeView.clearRecipe();
		renderLoader(elements.recipe);

		// Highlight selected search item
		if(state.search) searchView.highlightSelected(id);

		// Create a new recipe obj
		state.recipe = new Recipe(id);

		try {
			// Get Recipe Data and parse ingredients
			await state.recipe.getRecipe();
			state.recipe.parseIngredients();

			// Calculte servngs and time
			state.recipe.calcTime();
			state.recipe.calcServings();

			// Render recipe
			clearLoader();
			recipeView.renderRecipe(
				state.recipe, 
				state.likes.isLiked(id)
			);
			
		} catch (error) {
			alert('Error Processing Recipe!');
		}
		
	}
};

// window.addEventListener('hashchange', controlRecipe);
// window.addEventListener('load', controlRecipe);
['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));


/************************
*** LIST CONTROLLER ***
************************/
const controlList = () => {
	// Create a new list if there is None yet
	if(!state.list) state.list = new List();

	// Add each ingredient to the list & UI
	state.recipe.ingredients.forEach(el => {
		const item = state.list.addItem(el.count, el.unit, el.ingredient);
		listView.renderItem(item);
	});


}

// Handle Delete and Update list item events
elements.shopping.addEventListener('click', e=> {
	const id = e.target.closest('.shopping__item').dataset.itemid;

	// Handel delete button
	if(e.target.matches('.shopping__delete, .shopping__delete *')){
		// delete from the state
		state.list.deleteItem(id);

		// delete from UI
		listView.deleteItem(id);

	// Handle count update
	} else if (e.target.matches('.shopping__count-value')) {
		// e.target => is the element that was clicked
		const val = parseFloat(e.target.value);
		state.list.updateCount(id, val);
	}
});



/************************
*** LIKE CONTROLLER ***
************************/
// TESTING


const controlLike = () => {
	if(!state.likes) state.likes = new Likes();
	const currentID = state.recipe.id;

	//user has NOT yet liked recipe
	if (!state.likes.isLiked(currentID)) {
		// add like to the state
		const newLike = state.likes.addLike(
			currentID,
			state.recipe.title,
			state.recipe.author,
			state.recipe.img
		)
		// toggle the like button
		likesView.toggleLikeBtn(true);

		// add like to UI list
		likesView.renderLikes(newLike);

	//user HAS liked recipe
	} else {
		// Remove like from state
		state.likes.deleteLike(currentID);

		// toggle the like button
		likesView.toggleLikeBtn(false);

		// remove like from UI
		likesView.deleteLike(currentID);
	}
	likesView.toggleLikeMenu(state.likes.getNumLikes());
};


// Restore likes recipe on page load
window.addEventListener('load', () => {
	state.likes = new Likes();

	// restore Likes
	state.likes.readStorage();

	// Toggle Button
	likesView.toggleLikeMenu(state.likes.getNumLikes());

	// Render the existing likes
	state.likes.likes.forEach(like => likesView.renderLikes(like));
});


// Handling recipe button clicks
elements.recipe.addEventListener('click', e => {

    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
		// Decrease button is clicked
		if (state.recipe.servings > 1) {
			state.recipe.updateServings('dec');
			recipeView.updateServingsIngredients(state.recipe);
		}
        
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // Increase button is clicked
		state.recipe.updateServings('inc');
		recipeView.updateServingsIngredients(state.recipe);

	} else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
		// Add ingredients to shopping list
		controlList();
	} else if (e.target.matches('.recipe__love, .recipe__love *')) {
		// Like controller
		controlLike();
	}
});