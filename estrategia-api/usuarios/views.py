from django.http import JsonResponse

def usuarios(request):
    if request.method == "GET":
        usuarios = {"id": 1, "nome": "Andr", "idade": 21}
        return JsonResponse(usuarios)