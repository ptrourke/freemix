/*global jQuery */
(function($, Freemix) {

   Freemix.facet.addFacetType({
       facetClass: Exhibit.NumericRangeFacet,
       propertyTypes: ["number", "currency"],
       thumbnail: "/static/exhibit/img/numeric-facet.png",
       label: "Range",
       config: {
           type: "NumericRange",
           interval: 10
       },
       generateExhibitHTML: function (config) {
           config = config || this.config;
           var result = $("<div ex:role='facet ex:facetClass='NumericRange></div>");
           result.attr("ex:expression", config.expression);
           if (config.name && config.name.length > 0) {
               result.attr("ex:facetLabel", config.name);
           }
           if (config.interval) {
               result.attr("ex:interval", config.interval);
           }

           return result;

       },
       showEditor: function(facetContainer) {
           var facet = this;
           var config = $.extend(true, {}, facet.config);
           var template = Freemix.getTemplate("numeric-facet-editor");
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

           function updateSlider() {
               var slider = $("#logo-facet-slider", template);

               if (config.src) {
                   var img = template.find("#facet-preview img");
                   img.load(function() {
                        var naturalWidth = img.get(0).naturalWidth;
                        if (!naturalWidth) {
                            naturalWidth = img.get(0).width * 2;
                        }

                        slider.slider('option', 'max', naturalWidth);
                        slider.slider('option', 'value', config.width || img.get(0).width);
                    });
               } else {

               }
           }

           var select = template.find("#facet_property");
           var properties = Freemix.facet.generatePropertyList(facet.propertyTypes);

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

           var interval = template.find("#range_interval");
           var slider = template.find("#range_interval_slider");

           interval.val(config.interval);
           interval.change(function(event) {
               config.interval = $(event.target).val();
               slider.slider("value", config.interval);
               updatePreview();

           });

           slider.slider({
               slide: function(event, ui) {
                   interval.val(ui.value);
                   config.interval=ui.value;
                   updatePreview();
                   return true;
               }
           });

           dialog.empty().append(template).dialog("option", {
               title: "Edit Numeric Range",
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

           updatePreview();
           dialog.dialog("open");
        }
   });
})(window.Freemix.jQuery, window.Freemix);
