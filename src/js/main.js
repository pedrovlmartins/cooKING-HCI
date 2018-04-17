let baseApiUrl = "https://spoonacular-recipe-food-nutrition-v1.p.mashape.com";
let complexSearchUrl = baseApiUrl+"/recipes/searchComplex?addRecipeInformation=true&fillIngredients=1&ranking=1&limitLicense=false&number=25&offset=0&cuisine={cuisine}&intolerances={intolerances}&query={query}&type={type}";
let ingredientSearchUrl = baseApiUrl+"/recipes/findByIngredients?fillIngredients=false&ingredients={ingredients}&limitLicense=false&number=25&ranking=2";
let getRecipeInformation = baseApiUrl+"/recipes/{id}/analyzedInstructions?stepBreakdown=true";
let getDetailedRecipeInformation = baseApiUrl+"/recipes/{id}/information?includeNutrition=false";

var results = [];
var currentResultIndex = 0;
var userAvailableIngredients = [];
var userLocale = 'en';
var userCountry = 'English';
var userDiet = '';
var userIntolerances = [];
var currentRecipeIngredients = [];
let ingredientSelectWrapper = undefined;

let naturalSearchWhite = true;
let ingredientSearchWhite = false;
let groceriesWhite = false;

function getRecipeInfo(id, callback){
    httpRequest(getRecipeInformation.replace('{id}',id),callback);
}

function getDetailedRecipeInfo(id, callback){
    httpRequest(getDetailedRecipeInformation.replace('{id}',id),callback);
}

$(document).ready(function() {
    $('#splash').modal('show');
    setTimeout(function(){
        $('#testbar').css("width", 33+"%");
        initSearch();
    },1000);
    setTimeout(function(){
        $('#testbar').css("width", 66+"%");
        initButtons();
    },1500);
    setTimeout(function(){
        initMultiSelectors();
    },2000);
    setTimeout(function(){
        $('#testbar').css("width", 100+"%");
    },2500);
    setTimeout(function(){
        $('#splash').modal('hide');
        $('#countrySelect').multiselect('select','HU');
        $('#myModal').modal('show');
    }, 5000);

    $('#voicecontrol').click(function(){
       $('#voiceControlHelp').modal('show');
    });
    
    //hacks4life to prevent unresponsive interface
});

function buildPagination(steps) {
    var isFirst = true;
    var paginationDOM = `<ul class="pagination pagination-lg">`;
    var i = 1;
    for(var step in steps){
        if(steps[step].step.length > 5) {
            var stepNum = parseInt(i);
            paginationDOM += `<li ${isFirst ? "class=\"active\"" : ""}><a data-toggle="tab" href="#${stepNum}">${stepNum}</a></li>`;
            isFirst = false;
            i++;
        }

    }
    return paginationDOM+`</ul>`;
}

function buildSteps(steps) {
    var stepsDOM = '';
    var isFirst = true;
    var i = 1;
    for(var step in steps){
        if(steps[step].step.length > 5){
            let stepNum = parseInt(i);
            var ingredientsForStep = '';
            for(var ingredient of steps[step].ingredients){
                if(ingredient.image !== null && ingredient.image.indexOf("no.jpg") === -1){
                    ingredientsForStep += `
                    <div style="width:100px;display: inline-block;">
                        <img src="${ingredient.image}">
                        <span style="display:block;text-align: center;">${ingredient.name}</span>
                    </div>`;
                }
            }
            stepsDOM +=
                `<div id="${stepNum}" class="tab-pane ${isFirst ? "in active" : ""} full-height">
                    <h3>Step ${stepNum}</h3>
                    <div class="step-description full-height">
                        <p style="max-height: 315px;overflow-y: scroll;">${steps[step].step}</p>
                        <div class="ingredient-description">
                            <p><strong>Ingredients for step ${stepNum}:</strong></p>
                            ${ingredientsForStep !== '' ? ingredientsForStep : "none"}
                        </div>
                    </div>
                </div>`;
            isFirst = false;
            i++;
        }
    }
    if(stepsDOM === '') {
        return `<div id="1" class="tab-pane in active full-height">
                <h3>We are sorry</h3>
                <div class="step-description full-height">
                    <p>There does not appear to be a recipe description available for this dish. For questions and/or complaints please contact us at info@cooking.com</p>
                    
                </div>
            </div>`;
    }
    return stepsDOM;
}

function buildResultView(callback, nextOrPrev) {
    getRecipeInfo(results[currentResultIndex].id, function(response){
        let prevIndex = currentResultIndex - 1 > -1 ? currentResultIndex - 1 : results.length - 1;
        let nextIndex = currentResultIndex + 1 < results.length - 1 ? currentResultIndex + 1 : 0;
        let recipe = JSON.parse(response);
        let stepTest = recipe[0] !== undefined ? recipe[0].steps : [];
        if(stepTest.length === 0){
            if(nextOrPrev === 'next'){
                currentResultIndex = nextIndex;
            }
            if(nextOrPrev === 'previous'){
                currentResultIndex = prevIndex;
            } else {
                currentResultIndex = nextIndex;
            }
            buildResultView(callback, nextOrPrev);
        } else {
            getDetailedRecipeInfo(results[currentResultIndex].id, function (detailedReponse) {
                let detailedRecipe = JSON.parse(detailedReponse);
                let steps = recipe[0] !== undefined ? recipe[0].steps : [];
                let extendedIngredients = detailedRecipe.extendedIngredients;
                var ingredients = "";
                let scrolList = `<ul id='ingredientList'>`;
                currentRecipeIngredients = [];
                for (var ingredient of extendedIngredients) {
                    if (currentRecipeIngredients.indexOf(ingredient.name) === -1) {
                        ingredients += ingredient.originalString + ', ';
                        currentRecipeIngredients.push(ingredient.name);
                        scrolList += `<li>${ingredient.originalString}</li>`;
                    }
                }
                scrolList += `</ul>`;

                ingredients = ingredients.slice(0, ingredients.length - 2);
                var mins = detailedRecipe.readyInMinutes === undefined ? "unspecified" : detailedRecipe.readyInMinutes;
                console.log(detailedRecipe);
                let resultView = `<div class="row main-body">
                    <div class="col-md-6 col-xs-6 col-sm-6 recipe-left-pane full-height" style="">
                        <div class="col-md-2 col-xs-2 col-sm-2 full-height">
                            <div id="recipe-nav-prev">
                                <img height="100%" align="center" src="${results[prevIndex].image}"/>
                                <div class="nav-arrow">
                                    <img height="50px" width="50px" src="../img/Arrow%20previous.png"/>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-8 col-xs-8 col-sm-8 full-height">
                            <div class="row" style="height:50%"> <div class="col-md-12 col-xs-12 col-sm-12 full-height" style="overflow: hidden;vertical-align: bottom;">
                            <img width="100%" src="${results[currentResultIndex].image}"/></div></div>
                            <div class="recipe-short-description">
                                <h3>${results[currentResultIndex].title}</h3>
                                <p>
                                    <strong>Ready in:</strong>
                                    ${mins} minutes
                                </p>
                                <p>
                                    <strong>Required ingredients:</strong>
                                    ${scrolList}                        
                                </p>
                                <button id="textsearch-add-ingredients" type="button" class="btn btn-custom-red">Add ingredients to shopping list</button>
                            </div>
                        </div>
                        <div class="col-md-2 col-xs-2 col-sm-2 full-height">
                            <div id="recipe-nav-next">
                                <img height="100%" align="center"src="${results[nextIndex].image}"/>
                                <div class="nav-arrow">
                                    <img height="50px" width="50px" src="../img/Arrow%20next.png"/>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 col-xs-6 col-sm-6 full-height" style="text-align: center">
                        <div class="tab-content">
                            ${buildSteps(steps)}
                        </div>
                        ${buildPagination(steps)}
                    </div>
                </div>`;
                callback(resultView);
            });
        }
    });
}

function refreshResultView(message, fromSearch) {
    if(message){
        $('#messageoverlay').html(message);
    }
    if(!fromSearch){
        $('#messageoverlay').toggleClass('hidden');
    }
    var nextOrPrev = '';
    if(message.indexOf("next") > -1){
        nextOrPrev = 'next';
    }
    if(message.indexOf("previous") > -1){
        nextOrPrev = 'previous';
    }
    //build html..
    buildResultView(function(resultView){
        //replace resultview in DOM
        $('#recipeview > div:first').replaceWith(resultView);
        $('#messageoverlay').toggleClass('hidden');
        initButtons();
    }, nextOrPrev);


}

function initIngredientSearch() {
    //TODO: check if filters are set correctly
    $('#ingredientsearch-search').click(function(){
        $('#messageoverlay').html("Searching for recipes...");
        $('#messageoverlay').toggleClass('hidden');
        var ingredients = '';
        $('#ingredientSelect option:selected').map(function(a, item){ingredients += ','+item.value});
        ingredients = ingredients.slice(1,ingredients.length);
        let requestUrl = ingredientSearchUrl.replace('{ingredients}',ingredients);
        httpRequest(requestUrl, function(response){
            let parsedResponse = JSON.parse(response);
            if(parsedResponse.length !== 0){
                results = parsedResponse;
                currentResultIndex = 0;
                refreshResultView("Searching for recipes...", true);
            } else {
                noResultHandler();
            }
        });
    });
}

function initTextSearch() {
    $('#textsearch-search').click(function() {
        searchNormal();
    });
}

function searchNormal(queryOverride){
    $('#messageoverlay').html("Searching for recipes...");
    $('#messageoverlay').toggleClass('hidden');
    var cuisine = '';
    $('#cuisineSelect option:selected').map(function(a, item){cuisine += ','+item.value});
    cuisine = cuisine.slice(1, cuisine.length);
    var diet = '';
    $('#dietSelect option:selected').map(function(a, item){diet = item.value});
    var type = '';
    $('#typeSelect option:selected').map(function(a, item){type = item.value});
    var intolerances = '';
    $('#intoleranceSelect option:selected').map(function(a, item){intolerances += ','+item.value});
    intolerances = intolerances.slice(1, cuisine.length);
    var query = '';
    query = $('#textsearch-query').val();
    let requestUrl = complexSearchUrl.replace('{cuisine}',cuisine).replace('{diet}',diet).replace('{type}',type).replace('{intolerances}',intolerances);
    if(queryOverride){
        requestUrl = requestUrl.replace('{query}',queryOverride);
        $('#textsearch-query').val(queryOverride);
        $('#navbar li:nth-child(1) > a').click();
    } else {
        requestUrl = requestUrl.replace('{query}',query);
    }
    httpRequest(requestUrl, function(response){
        let parsedResponse = JSON.parse(response);
        if(parsedResponse.results.length !== 0){
            results = parsedResponse.results;
            currentResultIndex = 0;
            refreshResultView("Searching for recipes...", true);
        } else {
            noResultHandler();
        }
    });
}

function selectValue(val){
    if(val){
        $('#ingredientSelect').multiselect('select', val);
        $('#navbar li:nth-child(2) > a').click()
    }
}

function noResultHandler() {
    $('#messageoverlay').html("We were unable to find any recipes, please refine your search.");
    setTimeout(function(){
        $('#messageoverlay').toggleClass('hidden');
    },2500)
}


function initSearch() {
    initTextSearch();
    initIngredientSearch();
}

function initButtons() {
    $('#recipe-nav-next').click(function(){
        currentResultIndex = currentResultIndex + 1 < results.length - 1 ? currentResultIndex + 1 : 0;
        refreshResultView("Loading next recipe...");
    });
    $('#recipe-nav-prev').click(function(){
        currentResultIndex = currentResultIndex - 1 > -1 ? currentResultIndex - 1 : results.length - 1;
        refreshResultView("Loading previous recipe...");
    });
    $('#ingredientSelectClear').click(function(){
        //$('#ingredientSelect').multiselect('deselectAll', false).multiselect('refresh');
        $('#ingredientSelectWrapper').replaceWith(jQuery.extend(true,{},ingredientSelectWrapper));
        $('#ingredientSelect').multiselect({
            enableCollapsibleOptGroups: true,
            enableFiltering: true,
            nonSelectedText: "Ingredients",
            buttonContainer: '<div id="ingredientSelectContainer" />',
            buttonWidth:310,
            maxHeight: 600,
            enableCaseInsensitiveFiltering: true
        });
    });
    $('#groceriesAddToList').click(function(){
        addSelectedIngredientsToList();
    });
    $('#groceriesClearList').click(function(){
       clearGroceryList();
    });
    $('#onBoardDone').click(function(){
        $('#onboardingIngredientSelect option:selected').map(function(a, item){userAvailableIngredients.push(item.value);});
        $('#countrySelect option:selected').map(function(a, item){userLocale = item.value; userCountry = item.innerHTML});
        $('#onboardDietSelect option:selected').map(function(a, item){userDiet = item.value});
        $('#onboardIntoleranceSelect option:selected').map(function(a, item){userIntolerances.push(item.value);});
        $('#ingredientSelect').multiselect('select', userAvailableIngredients);
        if(userDiet !== ""){
            $('#dietSelect').multiselect('select', userDiet);
        }
        $('#intoleranceSelect').multiselect('select', userIntolerances);
        $('#language').text(userCountry);
    });
    $('#textsearch-add-ingredients').click(function(){
        addIngredientInitiator(true)
    });
    $('#groceries-add-ingredients').click(function(){
        addIngredientInitiator(false)
    });
    $('#groceryMenu').click(function(){
        $('#groceryMenu > a > span').remove();
        $('#textsearch-add-ingredients').html("Add ingredients to shopping list");
        $('#textsearch-add-ingredients').disable(false);
    });

    $("#navbar > li:nth-child(1) a" ).click(function(){
        setTimeout(function(){
            $("#navbar > li:nth-child(1) > a > img").replaceWith(`<img style="position:absolute;left:35%" height="45px" src="../img/normalsearch_white.png"/>`);
            $("#navbar > li:nth-child(1) > span").css("color","white");
            $("#navbar > li:nth-child(2) > a > img").replaceWith(`<img style="position:absolute;left:35%" height="45px" src="../img/ingredientsearch.png"/>`);
            $("#navbar > li:nth-child(2) > span").css("color","black");
            $("#navbar > li:nth-child(3) > a > img").replaceWith(`<img style="position:absolute;left:35%" height="45px" src="../img/groceries.png"/>`);
            $("#navbar > li:nth-child(3) > span").css("color","black");
        },50);
    });

    $("#navbar > li:nth-child(2) a" ).click(function(){
        setTimeout(function(){
            $("#navbar > li:nth-child(1) > a > img").replaceWith(`<img style="position:absolute;left:35%" height="45px" src="../img/normalsearch.png"/>`);
            $("#navbar > li:nth-child(1) > span").css("color","black");
            $("#navbar > li:nth-child(2) > a > img").replaceWith(`<img style="position:absolute;left:35%" height="45px" src="../img/ingredientsearch_white.png"/>`);
            $("#navbar > li:nth-child(2) > span").css("color","white");
            $("#navbar > li:nth-child(3) > a > img").replaceWith(`<img style="position:absolute;left:35%" height="45px" src="../img/groceries.png"/>`);
            $("#navbar > li:nth-child(3) > span").css("color","black");
        },50);
    });

    $("#navbar > li:nth-child(3) a").click(function(){
        setTimeout(function(){
            $("#navbar > li:nth-child(1) > a > img").replaceWith(`<img style="position:absolute;left:35%" height="45px" src="../img/normalsearch.png"/>`);
            $("#navbar > li:nth-child(1) > span").css("color","black");
            $("#navbar > li:nth-child(2) > a > img").replaceWith(`<img style="position:absolute;left:35%" height="45px" src="../img/ingredientsearch.png"/>`);
            $("#navbar > li:nth-child(2) > span").css("color","black");
            $("#navbar > li:nth-child(3) > a > img").replaceWith(`<img style="position:absolute;left:35%" height="45px" src="../img/groceries_white.png"/>`);
            $("#navbar > li:nth-child(3) > span").css("color","white");
        },50);
    });
};

function addIngredientInitiator(showBadge){
    var missingIngredients = [];
    for(let ingredient of currentRecipeIngredients){
        var add = true;
        for(let available of userAvailableIngredients){
            if(ingredient.indexOf(available) > -1){
                add = false;
            }
        }
        if(add){
            missingIngredients.push(ingredient);
        }
    }
    if(showBadge){
        $('#textsearch-add-ingredients').html("Ingredients added to shopping list!");
        $('#textsearch-add-ingredients').disable(true);
        $('#groceryMenu > a').append("<span class=\"badge\" style=\"background-color:#000000;transform:skew(25deg,0deg); -ms-transform:skew(25deg,0deg); -webkit-transform:skew(25deg,0deg);\">!</span>");
    }
    addSelectedIngredientsToList(missingIngredients);
}

jQuery.fn.extend({
    disable: function(state) {
        return this.each(function() {
            this.disabled = state;
        });
    }
});

let cloned = false;
function initMultiSelectors() {
    if(!cloned){
        ingredientSelectWrapper = jQuery.extend(true,{},$('#ingredientSelectWrapper').clone());
        cloned = true;
    }
    $('#ingredientSelect').multiselect({
        enableCollapsibleOptGroups: true,
        enableFiltering: true,
        enableCaseInsensitiveFiltering: true,
        nonSelectedText: "Ingredients",
        buttonContainer: '<div id="ingredientSelectContainer" />',
        buttonWidth:310,
        maxHeight: 600
    });

    $('#ingredientSelectContainer').click(function(){
        setTimeout(function(){$('#ingredientSelectContainer .caret-container .caret').click();},500);
    });

    $('#groceriesIngredientSelectContainer').click(function(){
        setTimeout(function(){$('#groceriesIngredientSelectContainer .caret-container .caret').click();},500);
    });


    $('#dietSelect').val(-1).multiselect({
        nonSelectedText:"Diet",
        buttonWidth:130
    });
    $('#typeSelect').val(-1).multiselect({
        nonSelectedText:"Dish type",
        buttonWidth:130
    });
    $('#cuisineSelect').multiselect({
        enableFiltering: true,
        enableCaseInsensitiveFiltering: true,
        includeSelectAllOption: true,
        nonSelectedText: "Cuisine(s)",
        buttonWidth:130,
        maxHeight:600

    });
    $('#intoleranceSelect').multiselect({
        nonSelectedText: "Intolerance(s)",
        buttonWidth:130
    });

    $('#countrySelect').val(-1).multiselect({
        enableFiltering: true,
        enableCaseInsensitsiveFiltering: true,
        nonSelectedText: "Select your country",
        buttonWidth:200,
        maxHeight:600

    });
    $('#onboardIntoleranceSelect').multiselect({
        nonSelectedText: "Intolerance(s)",
        buttonWidth:130
    });
    $('#onboardDietSelect').val(-1).multiselect({
        nonSelectedText:"Diet",
        buttonWidth:130
    });
    $('#onboardingIngredientSelect').multiselect({
        enableCollapsibleOptGroups: true,
        enableCaseInsensitiveFiltering: true,
        enableFiltering: true,
        nonSelectedText: "Ingredients",
        buttonContainer: '<div id="onboardingIngredientSelectContainer" />',
        buttonWidth:"100%",
        maxHeight: 300
    });
    $('#onboardingIngredientSelectContainer').click(function(){
        setTimeout(function(){$('#onboardingIngredientSelectContainer .caret-container .caret').click();},500);
    });
}

function addSelectedIngredientsToList(ingredients){
    var englishList = `<ul class="list-group">`;
    var translateString = "";
    for(let ingredient of ingredients) {
        englishList += `<li class="list-group-item">${ingredient}</li>`;
        translateString += "&text="+ingredient;
    }
    englishList += `</ul>`;
    $('#groceries-english > ul').replaceWith(englishList);

    //translateString = translateString.substring(0,translateString.length-1);
    translate(translateString, function(translated){
        var translatedList = `<ul class="list-group">`;
        for(let ingredient of translated){
            translatedList += `<li class="list-group-item">${ingredient}</li>`;
        }
        translatedList += `</ul>`;
        $('#groceries-translated > ul').replaceWith(translatedList);
        clickableIngredients();
    });
}

function clearGroceryList() {
    var emptyList = `<ul class="list-group"></ul>`;
    $('#groceries-english > ul').replaceWith(emptyList);
    $('#groceries-translated > ul').replaceWith(emptyList);
}

function httpRequest(theUrl, callback, noHeaders)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    };
    xmlHttp.open("GET", theUrl, true);
    if(noHeaders) {

    } else {
        xmlHttp.setRequestHeader("X-Mashape-Key", "24CPhwwRA5mshCihGxXlv89qHrEpp1ZFr7qjsn0g5dYwpyhrhn");
        xmlHttp.setRequestHeader("Accept", "application/json");
    }
    xmlHttp.send(null);
}

function translate(word, callback){
    var requestUrl = "https://translate.yandex.net/api/v1.5/tr.json/translate?key=trnsl.1.1.20161110T200920Z.e243bb77680a8c4d.e64f56c4611ab5d4e7ab3b0af03c6ac46af72194{word}&lang="+userLocale;
    requestUrl = requestUrl.replace("{word}",word);
    httpRequest(requestUrl, function(response){
        var parsedResponse = JSON.parse(response);
        if(parsedResponse.text.length > 0){
            callback(parsedResponse.text)
        } else {
            callback("");
        }
    }, true)
}

function clickableIngredients() {
    for (let htmlElement of $('#groceries-english ul li')) {
        $(htmlElement).click(function () {
            let index = $('#groceries-english ul li').toArray().indexOf(htmlElement)+1;
            $(htmlElement).toggleClass("highlighted");
            $('#groceries-translated ul li:nth-child('+index+')').toggleClass("highlighted");
        });
    }
    for (let htmlElement of $('#groceries-translated ul li')) {
        $(htmlElement).click(function () {
            let index = $('#groceries-translated ul li').toArray().indexOf(htmlElement)+1;
            $(htmlElement).toggleClass("highlighted");
            $('#groceries-english ul li:nth-child('+index+')').toggleClass("highlighted");
        });
    }
    $('#groceries-translated').on('scroll', function () {
        $('#groceries-english').scrollTop($(this).scrollTop());
    });
    $('#groceries-english').on('scroll', function () {
        $('#groceries-translated').scrollTop($(this).scrollTop());
    });
}



function getCountry(callback) {
    var requestUrl = "http://ip-api.com/json";
    httpRequest(requestUrl, function(response){
        var parsedResponse = JSON.parse(response);
        if(parsedResponse.status === "success"){
            callback({country: parsedResponse.country, countryCode: parsedResponse.countryCode.toLowerCase()});
        } else {
            callback();
        }
    }, true);
}
// text to optionlist script
// var txt = "dairy, egg, gluten, peanut, sesame, seafood, shellfish, soy, sulfite, tree nut, wheat";
// var txtArr = txt.split(', ');
// res = ``;
// for(var i of txtArr){
//     res += `<option value="${i}">${i.capitalizeFirstLetter()}</option>`;
// }
String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};
 var ingredients = [];
 var total = 0;
// function fillIngredients(){
//     for (let i = 65; i <= 90; i++) {
//         let c = String.fromCharCode(i);
//         let requestUrl = baseApiUrl+"/food/ingredients/autocomplete?metaInformation=true&number=100&query="+c;
//         httpRequest(requestUrl,function(response){
//             let ingredientArr = JSON.parse(response);
//             for(var ingredient of ingredientArr){
//                 var group = ingredient.aisle;
//                 var name = ingredient.name;
//                 if(group !== "Tea and Coffee"
//                     && group !== "Beverages"
//                     && group !== "Health Foods"
//                     && group !== "Online"
//                     && group !== "Alcoholic Beverages"
//                     && group !== "Dried Fruits"
//                     && group !== "Ethnic Foods"
//                     && group !== "Gluten Free"
//                     && group !== "Not in Grocery Store/Homemade"
//                     && group !== "Sweet Snacks"
//                     && group !== "Online"
//                     && group !== null
//                     && name.indexOf(" ") === -1
//                     ){
//                     if(typeof ingredients[group] === "undefined"){
//                         ingredients[group] = [];
//                     }
//                     if(typeof ingredients[group][name] === "undefined"
//                         && typeof ingredients[group][name.substr(0, name.length - 1)] === "undefined"
//                         && typeof ingredients[group][name+"s"] === "undefined"){
//                         ingredients[group].push(name);
//                         total++;
//                     }
//                 }
//             }
//         });
//     }
// }
//

function createOptions(){
    var optionsDOM = ``;
    var popularIngredients = "pasta, rice, chicken, pork, broccoli, cauliflower, ground meat, minced meat, onion, green onion, paprika, garlic, salt, pepper, flour, tomato, bread, egg, mayonnaise, ketchup, sour cream, whipped cream, apple, orange, banana, milk, yogurt, turkey, ham, cheese, white wine, red wine, beer, lemons, butter, mustard, tortilla, chocolate, potato";
    var popularArr = popularIngredients.split(", ");
    ingredients["Popular Ingredients"] = popularArr;
    for(var category in ingredients){
        optionsDOM += `<optgroup label="${category !== "null" ? category : "Other"}">`;
        for(var ingredient of ingredients[category]){
            total++;
            optionsDOM += `<option value="${ingredient}">${ingredient.capitalizeFirstLetter()}</option>`;
        }
        optionsDOM += `</optgroup>`
    }
    return optionsDOM;
}
