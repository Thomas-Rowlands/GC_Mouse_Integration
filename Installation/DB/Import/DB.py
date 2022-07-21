import mysql.connector


class Connection:
    def __init__(self, host, db, user, password):
        self.__con = None
        self.cursor = self.connect(host, db, user, password)

    def connect(self, host, db, user, password):
        self.__con = mysql.connector.connect(host=host, database=db, user=user, password=password)
        return self.__con.cursor()

    def close(self):
        self.__con.close()
