from artemis.api.main import services

if __name__ == "__main__":
    print(f"Loaded {len(services.cases.list_cases())} product fixtures.")
