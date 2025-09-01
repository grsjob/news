import { colorizedConsole } from "@/helpers/console";
import { TestServiceClass } from "@/services/test-service";

/**
 * в контроллеры собираем все логику, которая связана с конкретным роутом. Без обращений к БД и т.д. Типизацию кладем рядом с контроллером. Если больше одного файла в сервисе,
 * то их можно разбить по папкам
 */
class TestController {
  async testMethod() {
    try {
      colorizedConsole.accept("testMethod");
      const testData = await TestServiceClass.getTestData();
    } catch (error) {
      colorizedConsole.err(error);
    }
  }
}

export const TestControllerClass = new TestController();
