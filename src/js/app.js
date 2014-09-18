/*
 * This file is licenced CC0 http://creativecommons.org/publicdomain/zero/1.0/
 */

function initTypeahead() {
    var food_bh = new Bloodhound({
        datumTokenizer: function(d) {
            return Bloodhound.tokenizers.nonword(d.name);
        },
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        limit: 15,
        prefetch: 'data/food_ac.json'
    });

    food_bh.initialize();

    $('#food-search.typeahead').typeahead({
        highlight: true,
        minLength: 3
    },{
        name: 'food',
        source: food_bh.ttAdapter(),
        displayKey: 'name',
        templates: {
            suggestion: Handlebars.compile([
                '<img class="food-group" src="img/icons/32/{{food_group}}.png"/>',
                '<p class="food-name">{{name}}</p>',
                '<p class="food-description">{{description}}</p>'
                ].join(''))
        }
    });

    var previousSearchString = '';
    $('#food-search.typeahead').focus(function () {
        previousSearchString = this.value;
        this.value = '';
    });
    $('#food-search.typeahead').blur(function () {
        if (this.value == '') {
            this.value = previousSearchString;
        }
    });

}


Handlebars.registerHelper('list', function(items, options) {
    var out = "<ul>";

    for(var i=0, l=items.length; i<l; i++) {
        out = out + "<li>" + options.fn(items[i]) + "</li>";
    }

    return out + "</ul>";
});

$.when(
        $.getJSON('data/food.json'),
        $.getJSON('data/food_nutrient_per_volume.json'),
        $.getJSON('data/food_nutrient_per_weight.json'),
        $.getJSON('data/ingredient.json'),
        $.getJSON('data/nutrient.json'),
        $.getJSON('data/recipe.json'),
        $.get('template/food.html'),
        $(document).ready()
      ).then(function (foodX, fnpvX, fnpwX, ingredientX, nutrientX, recipeX, foodTemplateHtmlX) {

    // Get the actual JSON data from the jqXHR
    var food = foodX[0];
    var fnpv = fnpvX[0];
    var fnpw = fnpwX[0];
    var ingredient = ingredientX[0];
    var nutrient = nutrientX[0];
    /*
    function renameProperty(obj, oldName, newName) {
        // Check for the old property name to avoid a ReferenceError in strict mode.
        if (obj.hasOwnProperty(oldName)) {
            if (newName != oldName) {
                var value = obj[oldName];
                delete obj[oldName];
                obj[newName] = obj[oldName];
            }
        }
        return obj;
    };
    function cleanNutrientKeys(obj) {
        for (var i in obj) {
            renameProperty(obj, i, i.replace(/ /gi, '_').replace(/[\(\)]/gi, '').replace(/\%/gi, 'PERCENT'));
        }
        return obj;
    }
    cleanNutrientKeys(nutrient);
    */
    var recipe = recipeX[0];
    var foodTemplateHtml = foodTemplateHtmlX[0];

    var foodTemplate = Handlebars.compile(foodTemplateHtml);
    
    // when an item is selected from the auto completer
    function foodSelected (evt, suggestion, dataset) {
        var id = suggestion.id;
        var thisFood = food[id];

        window.location.hash = "#" + id;

        if (id in recipe) {
            recipe[id].forEach(function (i) {
                i.ingredient_name = ingredient[i.ingredient_id];
            });
        }

        var foodTemplateContext = {
            name: thisFood.name,
            scientific_name: thisFood.scientific_name,
            optional_name: thisFood.optional_name,
            food_group_code: thisFood.food_group_code,
            food_group: thisFood.food_group,
            sub_group: thisFood.sub_group,
            inedible_portion: thisFood.inedible_portion,
            edible_portion: thisFood.edible_portion,
            description: thisFood.description,
            sampling_details: thisFood.sampling_details,
            ingredients: recipe[id],
            fnpw: fnpw[id],
            fnpv: fnpv[id],
            nutrient: nutrient
        };
        $('#food-details').html(foodTemplate(foodTemplateContext));
        $('#sampling-details-link').popover();
    }
    initTypeahead();
    if (window.location.hash) {
        $('#food-search.typeahead').typeahead('val', food[window.location.hash.substring(1)].name);
        var suggestion = {
            id: window.location.hash.substring(1)
        };
        foodSelected(null, suggestion, null);
    }
    $('#food-search.typeahead').on('typeahead:autocompleted', foodSelected);
    $('#food-search.typeahead').on('typeahead:selected', foodSelected);

});




// charts

var ediblePortionChart = c3.generate({
    bindto: '#edible-portion',
    data: {
        columns: [
            ['data', 50],
            ['data1', 25]
        ],
        type: 'gauge',
        onclick: function (d, i) { console.log("onclick", d, i); },
        onmouseover: function (d, i) { console.log("onmouseover", d, i); },
        onmouseout: function (d, i) { console.log("onmouseout", d, i); }
    },
    color: {
        pattern: ['#FF0000', '#F97600', '#F6C600', '#60B044'], // the three color levels for the percentage values.
        threshold: {
            values: [30, 60, 90, 100]
        }
    }
});
