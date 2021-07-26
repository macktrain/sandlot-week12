DROP DATABASE IF EXISTS hr_db;
CREATE DATABASE hr_db;

USE hr_db;

CREATE TABLE hr_db.department (
    deptId int NOT NULL AUTO_INCREMENT,
    deptName VARCHAR(30),
    PRIMARY KEY (deptId));

INSERT INTO hr_db.department (deptName)
VALUES  ('Marketing'),
        ('Sales'),
        ('Engineering'),
        ('Support');

CREATE TABLE hr_db.role (
    roleId INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(30) NOT NULL,
    max_salary decimal(10,2) NOT NULL,
    deptId INT NOT NULL,
    FOREIGN KEY (deptId) REFERENCES hr_db.department (deptId),
    PRIMARY KEY (roleId));

INSERT INTO hr_db.role (title, max_salary, deptId)
VALUES  ('Marketing Manager', 120000.00,
            (select deptId from hr_db.department where deptName='Marketing')),
        ('Marketer', 85000.00,
            (select deptId from hr_db.department where deptName='Marketing')),
        ('Sales Manager', 115000.00,
            (select deptId from hr_db.department where deptName='Sales')),
        ('Sales Representative', 75000.00,
            (select deptId from hr_db.department where deptName='Sales')),
        ('Engineering Manager', 165000.00,
            (select deptId from hr_db.department where deptName='Engineering')),
        ('Senior Engineer', 125000.00,
            (select deptId from hr_db.department where deptName='Engineering')),
        ('Junior Engineer', 90000.00,
            (select deptId from hr_db.department where deptName='Engineering')),
        ('Support Manager', 150000.00,
            (select deptId from hr_db.department where deptName='Support')),
        ('Senior Support Engineer', 115000.00,
            (select deptId from hr_db.department where deptName='Support')),
        ('Junior Support Engineer', 80000.00,
            (select deptId from hr_db.department where deptName='Support'));

CREATE TABLE hr_db.employee (
    empId INT NOT NULL AUTO_INCREMENT,
    first_name VARCHAR(30) NOT NULL,
    last_name VARCHAR(30) NOT NULL,
    roleId INT NOT NULL,
    mgrId INT NULL,
    FOREIGN KEY (roleId) REFERENCES hr_db.role (roleId),
    FOREIGN KEY (mgrId) REFERENCES hr_db.employee (empId),
    PRIMARY KEY (empId));

SET foreign_key_checks = 0;

INSERT INTO hr_db.employee (first_name, last_name, roleId, mgrId) 
VALUES  ('Lee', 'Macklin', (SELECT roleId FROM hr_db.role WHERE title='Engineering Manager'), 0),
        ('Cliff', 'Macklin', (SELECT roleId FROM hr_db.role WHERE title='Marketing Manager'), 0),
        ('Tyler', 'Bolty', (SELECT roleId FROM hr_db.role WHERE title='Sales Manager'), 0),
        ('Ana', 'Abad', (SELECT roleId FROM hr_db.role WHERE title='Support Manager'), 0);

SET foreign_key_checks = 1;

INSERT INTO hr_db.employee (first_name, last_name, roleId, mgrId) 
VALUES
        ('Jared', 'Minaga', (select roleId from hr_db.role where title = 'Senior Engineer'), 1),
        ('Xavier', 'Sherrod', (select roleId from hr_db.role where title = 'Senior Engineer'), 1),
        ('Jason', 'Tilley', (select roleId from hr_db.role where title = 'Senior Engineer'), 1),
        ('Adam', 'Mielcarek', (select roleId from hr_db.role where title = 'Senior Engineer'), 1),
        ('Landon', 'Waddell', (select roleId from hr_db.role where title = 'Junior Engineer'), 1),
        ('Vanessa', 'Bonilha', (select roleId from hr_db.role where title = 'Junior Engineer'), 1),
        ('Jeremiah', 'Farthing', (select roleId from hr_db.role where title = 'Junior Engineer'), 1),
        ('Max', 'Sandoval', (select roleId from hr_db.role where title = 'Junior Engineer'), 1),
        ('Bilbo', 'Baggins', (select roleId from hr_db.role where title = 'Marketer'), 2),
        ('Max', 'Payne', (select roleId from hr_db.role where title = 'Marketer'), 2),
        ('Super', 'Man', (select roleId from hr_db.role where title = 'Marketer'), 2),
        ('Mag', 'Neto', (select roleId from hr_db.role where title = 'Marketer'), 2),
        ('Paul', 'Saul', (select roleId from hr_db.role where title = 'Sales Representative'), 3),
        ('Mat', 'Thew', (select roleId from hr_db.role where title = 'Sales Representative'), 3),
        ('Apostle', 'Mark', (select roleId from hr_db.role where title = 'Sales Representative'), 3),
        ('Luke', 'John', (select roleId from hr_db.role where title = 'Sales Representative'), 3),
        ('Paul', 'Romans', (select roleId from hr_db.role where title = 'Senior Support Engineer'), 4),
        ('Matthew', 'Mark', (select roleId from hr_db.role where title = 'Senior Support Engineer'), 4),
        ('Luke', 'John', (select roleId from hr_db.role where title = 'Junior Support Engineer'), 4),
        ('Acts', 'Corinthians', (select roleId from hr_db.role where title = 'Junior Support Engineer'), 4);