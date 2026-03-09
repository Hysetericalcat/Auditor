FROM python:3.11-slim

RUN pip install --no-cache-dir pandas numpy scipy matplotlib seaborn

#setting priviliges in linux kernel.
RUN useradd -m sandbox
USER sandbox

WORKDIR /sandbox