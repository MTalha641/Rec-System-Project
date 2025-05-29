from django.contrib import admin
from django.contrib.admin import AdminSite
from django.utils.translation import gettext_lazy as _


admin.site.site_header = _("RentSpot Admin Panel")
admin.site.site_title = _("RentSpot Admin")
admin.site.index_title = _("Welcome to RentSpot Administration")


class RentSpotAdminSite(AdminSite):
    site_header = "RentSpot Admin Panel"
    site_title = "RentSpot Admin"
    index_title = "Welcome to RentSpot Administration"
    
    def each_context(self, request):
        """
        Return a dictionary of variables to put in the template context for
        every page in the admin site.
        """
        context = super().each_context(request)
        context.update({
            'site_url': '/',  # Link to your main site
            'has_permission': request.user.is_active and request.user.is_staff,
        })
        return context
