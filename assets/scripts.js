$(document).ready(function() {  
  var states = [];
  var seats = {};

  // Function to get the Max value in Array
  Array.max = function( array ){
      return Math.max.apply( Math, array );
  };

  $.getJSON('data/population.json', function(data) {
    $.each(data, function(index, state) {
      var items = [];
      var state_name = state.state;
      var pop2010 = state.pop2010;
      var percentage = Math.round(state.change*10000)/100;
      var pop2020 = Math.round(pop2010 * (percentage / 100)) + parseInt(pop2010);

      states.push(state_name);

      items.push("<td class=\"state\">"+ state_name +"</td>");
      items.push("<td class=\"current-population\">"+ pop2010 +"</td>");
      items.push("<td class=\"projected-population\">"+ pop2020 +"</td>");
      items.push("<td data-value=\""+ percentage +"\">"+ percentage +"%</td>");
      items.push("<td class=\"current-apportionment\"></td>");
      items.push("<td class=\"projected-apportionment\"></td>");
      items.push("<td class=\"difference\"></td>");
 
      $('<tr/>', {
        'class': 'state',
        html: items.join('')
      }).appendTo('tbody');
    });
  }).done(function(){

    runApportionment = function(population_column, output_column) {
      var population = jQuery.map( population_column, function(td) { return $(td).text(); } );
      var seats = apportion(population);

      jQuery.each( output_column, function(index, td) {
        $(td).text(seats[states[index]]); 
      });
    }

    runApportionment($("td.current-population"), $("td.current-apportionment"));
    runApportionment($("td.projected-population"), $("td.projected-apportionment"));

    jQuery.each( $("tbody tr"), function(index, tr) {
      var $tr =  $(tr);
      var current = $tr.find("td.current-apportionment").text();
      var projected = $tr.find("td.projected-apportionment").text();

      var difference = projected - current;
      var sign = (difference > 0 ? "+" : "");
      var klass = (difference > 1) ? "gain-more" : (difference == 1 ? "gain" : (difference == -1 ? "lose" : (difference < -1 ? "lose-more" : "")));

      $tr.addClass(klass);
      $tr.find("td.difference").addClass(klass).text( sign + difference );
    });

    $("table").addClass("sortable");
    $.bootstrapSortable();

  });

  findHighestPriorityState = function(population) {
    var priorities = jQuery.map( states, function(state, index) {
      var pop = population[index];
      var n =  seats[state];
      var priority = pop / Math.sqrt(n*(n+1));
      
      return priority;
    });

    var index = priorities.indexOf( Array.max(priorities) );
    return states[index];
  };

  apportion = function(population) {
    // Assign 1 seat to each state
    jQuery.each( states, function(index, state) {
      seats[state] = 1;
    });

    for(n = 0; n < 385; n++) {
      highest = findHighestPriorityState(population);
      seats[highest] += 1;
    }

    return seats;
  };  

});