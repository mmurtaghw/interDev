from flask import Blueprint, jsonify, request, current_app
from werkzeug.utils import secure_filename
import os
from SPARQLWrapper import JSON, SPARQLWrapper, POST
from flask import make_response
import uuid
import requests
from flask_cors import CORS
import pycountry

UPLOAD_FOLDER = './uploads'
ALLOWED_EXTENSIONS = {'pdf'}

main = Blueprint('main', __name__)
CORS(main) 

@main.route('/search', methods=['GET'])
def search():
    # Simulate a SPARQL search and return a fixed result
    results = ['Item 1', 'Item 2', 'Item 3']
    return jsonify({'results': results})


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@main.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'})
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        return jsonify({'success': True, 'filename': filename})
    else:
        return jsonify({'error': 'File not allowed'})


def clean_trial(trial):
    cleaned_trial = {}
    
    for key, value in trial.items():
        # Remove non-standard characters and namespaces from keys
        clean_key = key.split("#")[-1]
        
        # Flatten arrays into a single string if necessary
        if isinstance(value, list):
            value = ", ".join(value)
        
        # Formatting text
        if isinstance(value, str):
            value = value.replace("\u00a0", " ").strip()  # Replace non-breaking spaces
            
        cleaned_trial[clean_key] = value
    
    return cleaned_trial

@main.route('/download_knowledge_graph_data', methods=['GET'])
def download_knowledge_graph_data():
    sparql = SPARQLWrapper("http://localhost:7200/repositories/RCT")
    sparql.setReturnFormat(JSON)  # Initially set to JSON to process query parameters
    trial_ids = request.args.getlist('trialIds')
    filters = request.args.to_dict(flat=False)
    filters.pop('trialIds', None)  # Remove 'trialIds' if present in filters

    # Define prefixes and base query
    prefixes = """
    PREFIX ercgt: <http://www.semanticweb.org/ERCT#>
    PREFIX gn: <http://www.geonames.org/ontology#>
    PREFIX ns1: <http://example.org/people/>
    """

    filter_conditions = ""
    for predicate, values in filters.items():
        for value in values:
            if predicate in ['Abstract', 'Authors', 'Sector', 'Title', 'Keywords', 'Language']:
                predicate_uri = f"ns1:{predicate}"
            elif predicate == 'countryCode':
                predicate_uri = f"gn:{predicate}"
            else:
                continue  # Skip unsupported filters

            filter_conditions += f"?s {predicate_uri} \"{value}\" .\n"

    values_clause = ""
    if trial_ids:
        values_clause = "VALUES ?s { " + " ".join([f"ns1:{id}" for id in trial_ids]) + " } "

    query = f"""
    {prefixes}
    CONSTRUCT {{ ?s ?p ?o }}
    WHERE {{
        {values_clause}
        ?s a ercgt:RandomisedControlledTrial ;
           ?p ?o .
        {filter_conditions}
    }}
    """

    sparql.setQuery(query)
    sparql.setReturnFormat('turtle')  # Set the format to Turtle for RDF data download
    results = sparql.query().convert()

    # Create a response object with Turtle data
    response = make_response(results)
    response.headers['Content-Type'] = 'text/turtle'
    return response

@main.route('/knowledge_graph_data', methods=['GET'])
def fetch_knowledge_graph_data():    
    sparql = SPARQLWrapper("http://localhost:7200/repositories/RCT")
    trial_ids = request.args.getlist('trialIds')  # Get multiple trialIds
    limit = request.args.get('limit', default=5, type=int)  # Fetch the limit
    filters = request.args.to_dict(flat=False)
    filters.pop('limit', None)  # Remove 'limit' if present in filters
    filters.pop('trialIds', None)  # Remove 'trialIds' if present in filters

    prefixes = """
    PREFIX ercgt: <http://www.semanticweb.org/ERCT#>
    PREFIX gn: <http://www.geonames.org/ontology#>
    PREFIX ns1: <http://example.org/people/>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    """

    filter_conditions = ""
    for predicate, values in filters.items():
        for value in values:
            if predicate in ['Abstract', 'Authors', 'Sector', 'Title', 'Keywords', 'Language']:
                predicate_uri = f"ns1:{predicate}"
            elif predicate == 'countryCode':
                predicate_uri = f"gn:{predicate}"
            else:
                continue  # Skip unsupported filters

            filter_conditions += f"?s {predicate_uri} \"{value}\" .\n"

    # Conditionally add VALUES clause if trial IDs are provided
    values_clause = ""
    if trial_ids:
        values_clause = "VALUES ?s { " + " ".join([f"ns1:{id.split(':')[-1]}" for id in trial_ids]) + " }\n"

    query = f"""
    {prefixes}
    SELECT ?s ?p ?o
    WHERE {{
        {values_clause}
        ?s a ercgt:RandomisedControlledTrial ;
           ?p ?o .
        {filter_conditions}
    }}
    """

    sparql.setQuery(query)
    sparql.setReturnFormat(JSON)
    results = sparql.query().convert()

    processed_data = {}
    for result in results["results"]["bindings"]:
        subject = result["s"]["value"]
        # Extract the trial ID from the subject URL
        trial_id = subject.split('/')[-1]  # Adjust this based on your URL structure

        if subject not in processed_data:
            processed_data[subject] = {'id': trial_id}
        
        predicate = result["p"]["value"].split("/")[-1]
        object_value = result["o"]["value"]
        
        if predicate in processed_data[subject]:
            if not isinstance(processed_data[subject][predicate], list):
                processed_data[subject][predicate] = [processed_data[subject][predicate]]
            processed_data[subject][predicate].append(object_value)
        else:
            processed_data[subject][predicate] = object_value

    filtered_data = [trial for trial in processed_data.values() 
                    if 'Abstract' in trial and 'Authors' in trial and 'Title' in trial]
    cleaned_data = [clean_trial(trial) for trial in filtered_data]

    limited_data = cleaned_data[:limit]

    response_data = {
        "count": len(limited_data),
        "results": limited_data
    }

    print(response_data["results"])

    response = make_response(jsonify(response_data))
    response.headers['Access-Control-Allow-Origin'] = '*'
    
    return response


def clean_trial(trial):
    # Your cleaning logic here
    return trial


from uuid import uuid4

@main.route('/add_knowledge_graph_entry', methods=['POST'])
def add_knowledge_graph_entry():
    data = request.get_json()

    # Extract data from the request
    abstract = data.get('Abstract', '')
    authors = data.get('Authors', '')
    title = data.get('Title', '')
    sector = data.get('Sector', '')
    country_code = data.get('countryCode', '')
    keywords = data.get('Keywords', '')
    evaluation_design = data.get('Evaluation_design', '')

    # Generate a unique identifier for the new trial
    uuid = uuid4()
    trial_uri = f"urn:uuid:{uuid}"

    # SPARQL query prefixes
    prefixes = """
    PREFIX ercgt: <http://www.semanticweb.org/ERCT#>
    PREFIX ns1: <http://example.org/people/>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX gn: <http://www.geonames.org/ontology#>
    """

    # Construct the SPARQL INSERT query using ns1 for custom properties
    query = f"""
    {prefixes}
    INSERT DATA {{
        <{trial_uri}> a ercgt:RandomisedControlledTrial ;
                      ns1:Abstract "{abstract}" ;
                      ns1:Authors "{authors}" ;
                      ns1:Title "{title}" ;
                      ns1:Sector "{sector}" ;
                      gn:countryCode "{country_code}" ;
                      ns1:Keywords "{keywords}" ;
                      ns1:Evaluation_design "{evaluation_design}" .
    }}
    """
    
    # Define the SPARQL endpoint URL
    sparql_endpoint = "http://localhost:7200/repositories/RCT/statements"

    headers = {
        "Content-Type": "application/sparql-update",
        "Accept": "application/sparql-results+json"
    }

    # Make the POST request to the SPARQL endpoint
    try:
        response = requests.post(sparql_endpoint, data=query, headers=headers)
        response.raise_for_status()  # Ensure we raise an error for bad responses
        return jsonify({'message': 'Entry added successfully', 'uuid': str(uuid)})
    except requests.HTTPError as err:
        return jsonify({'error': 'Failed to execute query', 'details': str(err)}), 500
    
    

@main.route('/knowledge_graph_trial', methods=['GET'])
def fetch_specific_knowledge_graph_trial():
    sparql = SPARQLWrapper("http://localhost:7200/repositories/RCT")
    trial_id = request.args.get('trialId')  # Get the trialId

    if not trial_id:
        return jsonify({"error": "trialId parameter is required"}), 400

    prefixes = """
    PREFIX ercgt: <http://www.semanticweb.org/ERCT#>
    PREFIX gn: <http://www.geonames.org/ontology#>
    PREFIX ns1: <http://example.org/people/>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    """

    query = f"""
    {prefixes}
    SELECT ?p ?o
    WHERE {{
        ns1:{trial_id.split(':')[-1]} a ercgt:RandomisedControlledTrial ;
           ?p ?o .
    }}
    """

    sparql.setQuery(query)
    sparql.setReturnFormat(JSON)
    results = sparql.query().convert()

    processed_data = {}
    for result in results["results"]["bindings"]:
        predicate = result["p"]["value"].split("/")[-1]
        object_value = result["o"]["value"]

        if predicate in processed_data:
            if not isinstance(processed_data[predicate], list):
                processed_data[predicate] = [processed_data[predicate]]
            processed_data[predicate].append(object_value)
        else:
            processed_data[predicate] = object_value

    response_data = {
        "id": trial_id.split(':')[-1],
        "data": processed_data
    }

    # print(trial_id.split(':')[-1])

    response = make_response(jsonify(response_data))
    response.headers['Access-Control-Allow-Origin'] = '*'
    
    return response


@main.route('/categories', methods=['GET'])
def fetch_categories():
    category = request.args.get('category', default='Sector', type=str).capitalize()
    sparql = SPARQLWrapper("http://localhost:7200/repositories/RCT")

    # Prefixes used in SPARQL queries
    prefixes = """
    PREFIX ns1: <http://example.org/people/>
    PREFIX ercgt: <http://www.semanticweb.org/ERCT#>
    PREFIX gn: <http://www.geonames.org/ontology#>
    """

    # Dynamically construct the SPARQL query based on the category
    if category == 'Country':
        category_field = 'gn:countryCode'
    elif category == 'Countrycode':
        category_field = 'gn:countryCode'
    else:
        category_field = f'ns1:{category}'

    query = f"""
    {prefixes}
    SELECT DISTINCT ?value
    WHERE {{
        ?trial a ercgt:RandomisedControlledTrial ;
               {category_field} ?value .
    }}
    """

    sparql.setQuery(query)
    sparql.setReturnFormat(JSON)
    results = sparql.query().convert()

    # Transform results into the expected structure
    categories = [{"name": result["value"]["value"]} for result in results["results"]["bindings"]]

    if category == 'Country':
        categories = []
        for result in results["results"]["bindings"]:
            country = pycountry.countries.get(alpha_2=result["value"]["value"])
            if country == None:
                continue
            category = {"name": country.name}
            categories.append(category)

    # if category == 'Country':
    #     categories = []
    #     for result in results["results"]:  # Step 2: The venture through each element
    #         category_name = result["value"]["value"]  # Step 3: Extracting the essence
    #         categories.append({"name": category_name})  # Step 4: Append to the cauldron

        # categories = []
        # for result in results["results"]:
        #     country = pycountry.countries.get(alpha_2=result["value"]["value"])
        #     if country == None:
        #         continue
        #     category = {"name": country.name}
        #     categories.append(category)

    #categories = [{"name": pycountry.countries.get(alpha_2=result["value"]["value"].upper()).name} for result in results["results"]["bindings"]]
    # Wrap the results in a response object
    response_data = {
        "count": len(categories),
        "results": categories
    }


    response = make_response(jsonify(response_data))
    response.headers['Access-Control-Allow-Origin'] = '*'
    
    return response

if __name__ == '__main__':
    main.run(debug=True, port=5000)