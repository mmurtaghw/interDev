from app import create_app
from SPARQLWrapper import SPARQLWrapper

app = create_app()
sparql = SPARQLWrapper("http://localhost:7200/repositories/your_repository")  # Replace with your actual SPARQL endpoint

from app import routes

if __name__ == '__main__':
    app.run(debug=True)