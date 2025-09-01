/**
 * Сервисы - служебные классы для работы с БД, запросов к другим сервисам, фетчинга данных и т.д. Типизацию кладем рядом с сервисом. Если больше одного файла в сервисе,
 * то создаем каталоги
 */
import { pool } from "../config/db";
import { QueryResult } from "pg";
import { Test } from "../db/models";
import { colorizedConsole } from "../helpers/console";

class TestService {
  async getTestData() {
    try {
      /**
       * для начала стучимся в базу таким образом. Если будет ряд типовых запросов, которые будут повторяться, то выноим их в отдельный класс в каталог db
       */
      const result: QueryResult<Test> = await pool.query("SELECT * FROM test");
      return result.rows;
    } catch (error) {
      /**
       * по возможности нормально обрабатываем ошибки
       */
      colorizedConsole.err(error);
      throw error;
    }
  }
}

export const TestServiceClass = new TestService();
