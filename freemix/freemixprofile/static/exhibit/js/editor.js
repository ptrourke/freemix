/*global jQuery */
(function($, Freemix) {

    $.fn.freemixPopupButton = function(title, contentFunction, config) {
        return this.each(function() {
            var $this = $(this);
            $this.qtip($.extend(true, {
                content: {
                    text: "<div style='display:none;'></div>",
                    title: {
                        text: title,
                        button: "<span class='ui-icon ui-icon-closethick'/>"
                    }
                },
                position: {
                    adjust: {
                        screen: true
                    }
                },
                show: 'click',
                hide: 'unfocus',
                style: {
                    name: 'themeroller'
                }
            },
            config));

            var api = $this.qtip("api");
            api.beforeShow = function(event) {
                api.updateContent("<div style='display:none;'></div>");
                api.updateContent(contentFunction());
            };

        });
    };

    $.fn.freemixThumbnails = function(tags, items, clickHandler) {
        return this.each(function() {
            var list = $("<ul></ul>");
            $.each(tags,function(key, tag) {
                var item = items[tag];
                item.id = key;
                $("<a href='' title='" + item.label + "'><img src='" + item.thumbnail +
                    "' alt='" + item.label + "' title='" + item.label + "'/><span class='chooser-item-name'>" +
                    item.label + "</span></a>").click(function(e) {
                    clickHandler(item);
                    e.preventDefault();
                }).appendTo(list).wrap("<li></li>");
            });
            list.appendTo($(this));
        });
    };
    $.fn.facetContainer = function(properties) {
        return this.each(function() {
            var facetContainer = $.extend({},Freemix.exhibit.facetContainer);
            facetContainer._selector = $(this);
            facetContainer.id = facetContainer.findWidget().attr("id");

            var w = facetContainer.findWidget();
            w.sortable({
               connectWith: ['#build .facet-container'],
               distance: 10,
               handle: '.facet-header',
               items: '.facet'
            });
            w.data("model", facetContainer);
            w.addClass("ui-widget-content").addClass("facet-container");
            w.append("<div class='create-facet-button button button-icon-left' title='Add a Facet'><span class='ui-icon ui-icon-plus'></span>Add a Facet</div>");

            w.find(".create-facet-button").freemixPopupButton("Create a facet", function() {
                    return facetContainer.getPopupContent();
                },{
                    style: {width: {min: 430}},
                    position: {target: $(".create-facet-button .ui-icon", facetContainer.findWidget())}
                });
        });
    };

    $.fn.viewContainer = function(properties) {
        return this.each(function() {
            var viewContainer = $.extend({}, Freemix.exhibit.viewContainer);
            viewContainer.id = $(this).attr("id");

            var model = $(this).data("model", viewContainer);
            model.append("<ul class='view-set'></ul>");
            model.append("<div class='view-content'></div>");
            model.addClass("view-container");

            var set = model.find(".view-set");
            set.sortable({
                    // axis: "x",
                    tolerance: "pointer",
                    distance: 10,
                    connectWith: ".view-container>ul",
                    cancel: "li.create-view, .bt-wrapper",
                    items: "li:not(.create-view)",
                    receive: function(event, ui) {
                        $(ui.item).data("model")._container = undefined;
                    }
                });
            set.append("<li class='create-view ui-state-default'><div class='create-view-button button button-icon-left'><span class='ui-icon ui-icon-plus'></span><span class='label'>Add a View</span></div></li>");
            set.find(".create-view-button").freemixPopupButton("Create a View", function() {
                    return viewContainer.getPopupContent();
                },{style: {width: {min: 430}}});
        });
    };

    Freemix.getBuilder = function() {
        return $("#build");
    };

    Freemix.getPreview = function() {
        return $("#preview");
    };

    $.fn.generateExhibitHTML = function(model) {
        return this.each(function() {
            var root = $(this);
            if (model.text) {
                $.each(model.text, function(key, value) {
                    var id = $(this).attr("id");
                    root.find("#" + key).text(value);
                });
            }
            root.find(".view-container").each(function() {
                var id = $(this).attr("id");
                var container = $("<div class='view-panel' ex:role='viewPanel'></div>");
                $.each(model.views[id], function() {
                    var view = Freemix.view.createView(this);
                    container.append(view.generateExhibitHTML());
                });

                root.find(".view-container#" + id).append(container);
            });

            $.each(model.facets, function(container, facets) {
                $.each(facets, function() {
                    var facet = Freemix.facet.createFacet(this);
                    root.find(".facet-container#" +container).append(facet.generateExhibitHTML());
                });
            });
        });
    };

    function syncMetadata(model) {
        var metadata = {};
        metadata.canvas = model.canvas;
        metadata.theme = model.theme;
        metadata.text = $.extend({}, model.text);
        var properties = [];
        $.each(model.localProperties, function(key, value) {
            properties.push(value);
        });
        metadata.properties =properties;
        metadata.facets = {};
        $(".facet-container", Freemix.getBuilder()).each( function() {
            var data = $(this).data("model");
            metadata.facets[$(this).attr("id")] = data.getConfigList();
        });

        metadata.views = {};
        $(".view-container",Freemix.getBuilder()).each( function() {
            var data = $(this).data("model");
            metadata.views[$(this).attr("id")] = data.getConfigList();
        });


        return metadata;
    }

    function updatePreview() {
        var metadata = syncMetadata(Freemix.profile);
        Freemix.getPreview().empty();
        $("#canvas-template").clone().appendTo(Freemix.getPreview()).generateExhibitHTML(metadata).createExhibit();

    }

    var publishing = false;

    function publish() {
        if (!publishing) {
            var metadata = $.toJSON(syncMetadata(Freemix.profile));

            var method="POST";

            if (window.location.hash.startsWith("#freemix=")) {
                var publishURL = window.location.hash.substring("#freemix=".length, window.location.hash.length);
            } else {
                publishURL = $("link[rel='freemix/publish']").attr("href");
            }
            publishing = true;
            var xhr = $.ajax({
             //url: publishURL,
             type: method,
             data: metadata,
             success: function(data) {

                 $("#publish>div").hide();
                 var url = $(String(data)).find("a").attr("href");
                 window.location.hash = "freemix=" + url;
                 $("link[ref='freemix/publish']").attr("href", url);

                 $("#publish #publish-url").empty().append(data);
                 publishing = false;
                 $("#publish-success").show();
             },
             error: function (r, textStatus, error) {
                 $("#publish>div").hide();
                 $("#publish-failed #publish-error").empty().append(textStatus + " " + error);
                 publishing = false;
                 $("#publish-failed").show();
             }
            });
        }

    }

    function updateBuilder() {
        $(".view-container", Freemix.getBuilder()).each(function() {
            var container = $(this).data("model");
            container.getSelected().data("model").select();
        });
    }


    function build_db() {
        var profile = Freemix.profile;



        Freemix.property.initializeFreemix();
        // Setup Themeing
        var theme = Freemix.profile.theme;
        $("#theme").themeswitcher({
            loadTheme: Freemix.profile.theme,
            onSelect: function(theme) {
                Freemix.profile.theme = theme;
            }
        });

        var data = $.freemix.data || [$("link[rel='exhibit/data']").attr("href")];
        
        var database = $.exhibit.initializeDatabase(data, function() {
            $(".view-container", Freemix.getBuilder()).viewContainer();
            $.each(profile.views, function(container, views) {
                $.each(views, function() {
                    var view = Freemix.view.createView(this);
                    Freemix.view.getViewContainer(container).addView(view);
                });
            });

            $(".facet-container", Freemix.getBuilder()).facetContainer();
            $.each(profile.facets, function(container, facets) {
                $.each(facets, function() {
                    var facet = Freemix.facet.createFacet(this);
                    Freemix.facet.getFacetContainer(container).addFacet(facet);
                });
            });


            new Freemix.Identify(database);
            $(".step-menu").freemixStepTabs("select", "#build");
            $("#contents").show();
        });

    }

    function setup_ui() {
         $(".step-menu").freemixStepTabs({
            build: updateBuilder,
            preview: updatePreview,
            publish: publish
        });

        $('.ui-state-default').hover(
            function(){
                $(this).addClass('ui-state-hover');
            }, function(){
                $(this).removeClass('ui-state-hover');
            }
        );
        $(".editable", Freemix.getBuilder()).each(function() {
            var $this = $(this);

            var placeholder = "<span class='placeholder'>Click to Edit...</span>";
            if ($this.attr("title")) {
                placeholder = "Click to Edit " + $this.attr("title") + "...";
            }

            $this.editable(function(value,settings) {
                if (!Freemix.profile.text) {
                    Freemix.profile.text = {};
                }
                Freemix.profile.text[$this.attr("id")] = (value === placeholder) ? undefined : value;
                return value;
            }, {
                onblur:"submit",
                placeholder:placeholder,
                tooltip: placeholder
            });
            if (Freemix.profile.text && Freemix.profile.text[$this.attr("id")]) {
                $this.text(Freemix.profile.text[$this.attr("id")]);
            }
        });

    }

    function display() {


        var profile_url = $("link[rel='freemix/exhibit_profile']").attr("href");
        $.ajax({
            url: profile_url,
            type: "GET",
            dataType: "json",
            success: function(p) {
                Freemix.profile = p;
                var dp_url = $("link[rel='freemix/dataprofile']").attr("href");
                $.ajax({
                    url: dp_url,
                    type: "GET",
                    dataType: "json",
                    success: function(dp) {
                        Freemix.data_profile=dp;
                        setup_ui();
                        build_db();
                    }
                });
            }

        });

    }

    $(document).ready(function() {display();});

})(jQuery, jQuery.freemix);