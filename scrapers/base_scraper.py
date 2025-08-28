import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from utils.driver import get_driver


class BaseScraper:
    def __init__(self, url, headless=True, timeout=10):
        self.url = url
        self.driver = get_driver(headless=headless)
        self.wait = WebDriverWait(self.driver, timeout)

    def open_page(self):
        self.driver.get(self.url)

    def accept_cookies(self, selector):
        try:
            cookie_button = self.wait.until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
            )
            cookie_button.click()
            time.sleep(1)
            print("Cookies accepted.")
        except TimeoutException:
            print("No cookie banner found.")

    def fill_age_gate(self, selectors, birthdate=("01", "01", "1990")):
        try:
            print("Looking for age verification...")
            day_input = self.wait.until(
                EC.visibility_of_element_located((By.CSS_SELECTOR, selectors["day"]))
            )
            month_input = self.driver.find_element(By.CSS_SELECTOR, selectors["month"])
            year_input = self.driver.find_element(By.CSS_SELECTOR, selectors["year"])

            day_input.send_keys(birthdate[0])
            month_input.send_keys(birthdate[1])
            year_input.send_keys(birthdate[2])

            submit_button = self.wait.until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, selectors["submit"]))
            )
            self.driver.execute_script("arguments[0].click();", submit_button)
            time.sleep(2)
            print("Age gate filled.")
        except TimeoutException:
            print("No age gate found.")

    def close(self):
        print("Closing browser...")
        self.driver.quit()
