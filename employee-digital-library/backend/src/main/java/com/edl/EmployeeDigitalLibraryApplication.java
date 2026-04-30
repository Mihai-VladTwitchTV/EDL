package com.edl;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class EmployeeDigitalLibraryApplication {
    public static void main(String[] args) {
        SpringApplication.run(EmployeeDigitalLibraryApplication.class, args);
        System.out.println("Application Backend Started Succesfully! \n");
    }
}
