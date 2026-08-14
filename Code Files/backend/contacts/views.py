from rest_framework import viewsets, generics, permissions
from django.contrib.auth.models import User
from .models import Contact
from .serializers import ContactSerializer, UserSerializer

class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.AllowAny,)

class ContactViewSet(viewsets.ModelViewSet):
    serializer_class = ContactSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        # Enforce scoping: only contacts owned by the current authenticated user, sorted alphabetically
        return Contact.objects.filter(owner=self.request.user).order_by('name')

    def perform_create(self, serializer):
        # Automatically assign the logged-in user as the owner of the contact
        serializer.save(owner=self.request.user)
