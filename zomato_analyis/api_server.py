from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)


# ================= LOAD DATA =================

df = pd.read_csv("zomato.csv", encoding="latin1")


# Prepare cuisine list column once
df["Cuisine_List"] = df["Cuisines"].str.split(",")
df = df.explode("Cuisine_List")
df["Cuisine_List"] = df["Cuisine_List"].str.strip()


# ================= META API =================

@app.route("/meta", methods=["GET"])
def meta():

    cities = sorted(df["City"].dropna().unique().tolist())

    cuisines = sorted(
        df["Cuisine_List"]
        .dropna()
        .unique()
        .tolist()
    )

    return jsonify({
        "cities": cities,
        "cuisines": cuisines
    })


# ================= MARKET ANALYSIS =================

@app.route("/market-analysis", methods=["POST"])
def analyze():

    data = request.json

    city = data.get("city")
    cuisine = data.get("cuisine")


    # Filter data
    city_data = df[df["City"] == city]
    cuisine_data = df[df["Cuisine_List"] == cuisine]

    both = city_data[city_data["Cuisine_List"] == cuisine]


    # No data case
    if len(both) == 0:

        return jsonify({

            "avg_rating": 0,
            "avg_cost": 0,
            "avg_votes": 0,
            "total_restaurants": 0,

            "demand": "Low",
            "recommendation": "No data found",

            "top_city_cuisines": {},
            "top_cuisine_cities": {},

            "best_options": []

        })


    # ================= BASIC METRICS =================

    avg_rating = round(both["Aggregate rating"].mean(), 2)

    avg_cost = int(both["Average Cost for two"].mean())

    avg_votes = int(both["Votes"].mean())

    total = len(both)


    # ================= DEMAND =================

    if total > 150:
        demand = "High"
    elif total > 70:
        demand = "Medium"
    else:
        demand = "Low"


    # ================= RECOMMENDATION =================

    if demand == "High" and avg_rating >= 3.8:
        recommendation = "High profit potential. Strong market."
    elif demand == "Medium":
        recommendation = "Competitive market. Focus on quality."
    else:
        recommendation = "High risk. Try another area."


    # ================= TOP CUISINES IN CITY =================

    top_city_cuisines = (
        city_data["Cuisine_List"]
        .value_counts()
        .head(10)
        .to_dict()
    )


    # ================= TOP CITIES FOR CUISINE =================

    top_cuisine_cities = (
        cuisine_data["City"]
        .value_counts()
        .head(10)
        .to_dict()
    )


    # ================= BEST BUSINESS OPTIONS =================

    best_option_1 = f"Start {cuisine} restaurant in {city}"

    if len(top_cuisine_cities) > 0:
        best_city = list(top_cuisine_cities.keys())[0]
        best_option_2 = f"Try {cuisine} in {best_city}"
    else:
        best_option_2 = "Explore new cities"


    # ================= RESPONSE =================

    return jsonify({

        "avg_rating": avg_rating,
        "avg_cost": avg_cost,
        "avg_votes": avg_votes,
        "total_restaurants": total,

        "demand": demand,
        "recommendation": recommendation,

        "top_city_cuisines": top_city_cuisines,
        "top_cuisine_cities": top_cuisine_cities,

        "best_options": [
            best_option_1,
            best_option_2
        ]

    })



# ================= RUN SERVER =================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=7000,
        debug=True
    )
