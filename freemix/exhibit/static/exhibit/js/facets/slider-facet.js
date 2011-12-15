/*global jQuery */
 (function($, Freemix) {

    function isFacetCandidate(prop) {
        return (prop.values > 1 && prop.values + prop.missing != Freemix.exhibit.database.getAllItemsCount());
    }

    function simpleSort(a, b) {
        if (a.missing == b.missing) {
            return a.values - b.values;
        } else {
            return a.missing - b.missing;
        }
    }

    function sorter(a, b) {
        var aIsCandidate = isFacetCandidate(a);
        var bIsCandidate = isFacetCandidate(b);

        if ((aIsCandidate && bIsCandidate) || (!aIsCandidate && !bIsCandidate)) {
            return simpleSort(a, b);
        }
        return bIsCandidate ? 1: -1;
    }


    function generatePropertyList() {
        var properties = [];
        $.each(Freemix.property.getPropertiesWithTypes(["number", "currency"]),
        function(name, property) {
            properties.push(Freemix.exhibit.getExpressionCount(property.expression(), property.label()));
        });
        properties.sort(sorter);
        return properties;
    }

    Freemix.facet.addFacetType({
        facetClass: Exhibit.SliderFacet,
        propertyTypes: ["number", "currency"],

        thumbnail: "/static/exhibit/img/slider-facet.png",
        label: "Slider",
        config: {
            type: "Slider",
	    expression: "",	    
	    height: "50px"
        },
        generateExhibitHTML: function(config) {
            config = config || this.config;
            return "<div ex:role='facet' ex:facetClass='Slider' ex:histogram='true' ex:horizontal='true' ex:height='50px' ex:expression='" + config.expression +
                "' ex:facetLabel='" + config.name + "'></div>";
        },
        showEditor: function(facetContainer) {
              var facet = this;
              var config = $.extend(true, {}, facet.config);
              var template = Freemix.getTemplate("slider-facet-editor");
              facetContainer = facetContainer || facet.findContainer();
              var dialog = facetContainer.getDialog();
              template.data("model", this);
              template.find("form").submit(function() {return false;});




              function updatePreview() {
                  var preview = $(facet.generateExhibitHTML(config));
                  template.find("#facet-preview").empty().append(preview);
                  var exhibit = Freemix.getBuilderExhibit();
                  facet.facetClass.createFromDOM(preview.get(0), null, exhibit.getUIContext());

              }
              var select = template.find("#facet_property");
              var properties = generatePropertyList();

              $.each(properties, function() {
                  var option = "<option value='" + this.expression + "'>" + this.label + "</option>";
                  select.append(option);
              });
              if (config.expression) {
                  select.val(config.expression);
              } else {
                  select.get(0).options[0].selected=true;
                  config.expression = select.val();
              }
              select.change(function() {
                  config.expression = $(this).val();
                  updatePreview();
              });

              var label = template.find("#facet_name");
              label.val(config.name);
              label.change(function() {
                  config.name = label.val();
                  updatePreview();
              });
              dialog.empty().append(template).dialog("option", {
                  title: "Edit Numeric Slider",
                  position: "center",
                  buttons: [{
                     text: "Ok",
                     id: "ok-button",
                     click: function() {
                             var model = template.data("model");
                             model.config = config;
                             facetContainer.findWidget().trigger("edit-facet");
                             model.refresh();
                             facetContainer.getDialog().dialog("close");
                         }
                     },
                     {
                     text: "Cancel",
                     click: function() {
                             $(this).dialog("close");
                         }
                     }
                ]
              }).dialog("option", "position", "center");
              dialog.dialog("open");

              updatePreview();
          }
    });
})(window.Freemix.jQuery, window.Freemix);
