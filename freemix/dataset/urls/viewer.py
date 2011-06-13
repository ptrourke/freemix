from django.conf.urls.defaults import url, patterns

# Dataset parameters
from freemix.dataset import views

urlpatterns = patterns('',
    url(r"^(?P<owner>[a-zA-Z0-9_.-]+)/(?P<slug>[a-zA-Z0-9_.-]+)/$",
        views.DatasetResourceView.as_view(),
        name="dataset_detail"),
)