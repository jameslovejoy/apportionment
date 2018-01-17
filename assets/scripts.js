$(document).ready(function() {
  var $dataSource = $("select.source");
  var $tBody = $("tbody");

  // Function to get the Max value in Array
  Array.max = function( array ){
      return Math.max.apply( Math, array );
  };

  var toggleChanges = function(){
    var showChangesOnly = $("#toggleChanges").is(":checked");

    $("tr.state").toggle(!showChangesOnly);
    $("tr.state.gain, tr.state.lose, tr.state.gain-more, tr.state.lose-more").show(showChangesOnly);
  };

  var bindToggleChanges = function(){
    $("#toggleChanges").on("change", function(){
      toggleChanges();
    });
  };

  var mapProjectionData = {};
  var mapChangesData = {};

  var runProjection = function(){
    var states = [];
    var seats = {};
    var dataSource = $dataSource.find("option:selected").val();

    $.getJSON(dataSource, function(data) {
      $tBody.html('');

      $.each(data, function(index, state) {
        var items = [];
        var state_name = state.state;

        if (state.estimate) {
          var popStart = state.estimate.start.population;
          var popFinish = state.estimate.finish.population;
          var popChange = popStart < popFinish ? '+' + (popFinish-popStart) : popFinish-popStart;
          var startYear = state.estimate.start.year;
          var finishYear = state.estimate.finish.year;
        } else {
          var popStart = state.pop2000;
          var popFinish = state.pop2010;
          var popChange = popStart < popFinish ? '+' + (popFinish-popStart) : popFinish-popStart;
          var startYear = 2000;
          var finishYear = 2010;
        }
        $('#startYear').text(startYear);
        $('#finishYear').text(finishYear);

        var pop2010 = state.pop2010;
        var percentage = Math.round(state.change*10000)/100;
        var pop2020 = Math.round(pop2010 * (percentage / 100)) + parseInt(pop2010);

        if( state_name == 'United States') {

          $("#US-popStart").text(popStart);
          $("#US-popFinish").html('<abbr title="' + popChange + ' since ' + startYear + '">' + popFinish + '</abbr>');
          $("#US-popChange").html('<abbr title="' + state.note + '">' + percentage + '%</abbr>');
          $("#US-popEst").text(Math.round(pop2010 * (percentage / 100)) + parseInt(pop2010));

        } else {
          states.push(state_name);

          items.push('<td class="state">' + state_name + '</td>');
          items.push('<td class="current-population hidden-phone">' + popStart + '</td>');
          items.push('<td class="estimated-population hidden-phone"><abbr title="' + popChange + ' since ' + startYear + '">' + popFinish + '</abbr></td>');
          items.push('<td class="hidden-phone" data-value="' + percentage + '"><abbr title="' + state.note + '">' + percentage + '%</abbr></td>');
          items.push('<td class="projected-population hidden-phone">' + pop2020 + '</td>');
          items.push('<td class="current-apportionment"></td>');
          items.push('<td class="projected-apportionment"></td>');
          items.push('<td class="difference"></td>');

          $('<tr/>', {
            'class': 'state',
            html: items.join('')
          }).appendTo('tbody');

        }
      });
    }).done(function(){

      runApportionment($("td.current-population"), $("td.current-apportionment"));
      runApportionment($("td.projected-population"), $("td.projected-apportionment"));

      jQuery.each( $("tbody tr"), function(index, tr) {
        var $tr =  $(tr);
        var current = $tr.find("td.current-apportionment").text();
        var projected = $tr.find("td.projected-apportionment").text();

        var difference = projected - current;
        var sign = (difference > 0 ? "+" : "");
        var klass = (difference > 1) ? "gain-more" : (difference == 1 ? "gain" : (difference == -1 ? "lose" : (difference < -1 ? "lose-more" : "")));
        if (difference != 0 ) {
          mapChangesData[$tr.find("td.state").text()] = difference;
        }

        $tr.addClass(klass);
        $tr.find("td.difference").addClass(klass).text( sign + difference );
      });

      new Chartkick.GeoChart("map-projection", mapProjectionData, {"library": {"region": "US", "resolution": "provinces", "colorAxis": []} });
      new Chartkick.GeoChart("map-changes", mapChangesData, {"library": {"region": "US", "resolution": "provinces", "colorAxis": {"colors": ['salmon', 'lightsalmon', 'white', 'lime', 'limegreen'], "minValue": -4, "maxValue": 4}, "defaultColor": 'white' } });

      $("table").addClass("sortable");
      $.bootstrapSortable();
      $tBody.css({opacity: 1});

      toggleChanges();

    });

    runApportionment = function(population_column, output_column) {
      var population = jQuery.map( population_column, function(td) { return $(td).text(); } );
      var seats = apportion(population);

      jQuery.each( output_column, function(index, td) {
        $(td).text(seats[states[index]]);
        mapProjectionData[states[index]] = seats[states[index]];
      });
    }

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

      // 435 seats: Every state gets 1 to start, leaving 385 left to apportion.
      for(n = 0; n < 385; n++) {
        highest = findHighestPriorityState(population);
        seats[highest] += 1;

        seat_number = 51 + n;
        console.log("Assigning Seat " + seat_number + " to " + highest);
      }

      return seats;
    };

  };

  $dataSource.on("change", function(){
    $tBody.css({opacity: 0.5});

    runProjection();
  });

  runProjection();
  bindToggleChanges();

});