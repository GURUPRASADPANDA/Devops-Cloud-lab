from setuptools import setup

setup(
    name="sandbox-cli",
    version="1.0.0",
    py_modules=["sandbox"],
    install_requires=["click>=8.0"],
    entry_points={
        "console_scripts": [
            "devops-sandbox=sandbox:cli",
        ],
    },
)
