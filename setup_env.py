import importlib.util
import subprocess
import sys
from pathlib import Path


IMPORT_MAP = {
    "fastapi": "fastapi",
    "uvicorn": "uvicorn",
    "pydantic": "pydantic",
    "scikit-learn": "sklearn",
    "pandas": "pandas",
    "numpy": "numpy",
    "joblib": "joblib",
    "python-multipart": "multipart",
}


def _import_available(module_name: str) -> bool:
    return importlib.util.find_spec(module_name) is not None


def ensure_requirements() -> None:
    """Install project dependencies from requirements.txt only when they are missing."""
    requirements_path = Path(__file__).resolve().parent / "requirements.txt"
    if not requirements_path.exists():
        return

    print("Ensuring project dependencies are installed...")
    with requirements_path.open("r", encoding="utf-8") as handle:
        requirements = [line.strip() for line in handle if line.strip() and not line.startswith("#")]

    missing = []
    for requirement in requirements:
        package_name = requirement.split("==")[0].split(">=")[0].split("<=")[0].split(">") [0].split("<")[0].strip()
        import_name = IMPORT_MAP.get(package_name, package_name)
        if not _import_available(import_name):
            missing.append(requirement)

    if not missing:
        print("All required dependencies are already available.")
        return

    subprocess.check_call([sys.executable, "-m", "pip", "install", *missing])


if __name__ == "__main__":
    ensure_requirements()
