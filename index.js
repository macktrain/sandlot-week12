//install mysql
const mysql = require('mysql');
//Instatll inquirer
const inquirer = require('inquirer');

const connection = mysql.createConnection({
    host: 'localhost',
  
    // Port using
    port: 3306,
  
    // DB username
    user: 'root',
  
    // DB Password
    password: 'myp4wd',

    // DB from mysql
    database: 'hr_db',
  });
//Initialize a globally scoped query string that will be re-used.
let empQuery =  '';
empQuery =  'SELECT e.empId as Id, e.first_name as fName, e.last_name as lName, role.title as title, ';
empQuery += '(Select b.first_name from employee as b where e.mgrId = b.empId) as mgr_Fname, ';
empQuery += '(Select b.last_name from employee as b where e.mgrId = b.empId) as mgr_Lname ';
empQuery += 'FROM employee as e ';
empQuery += 'JOIN role ON e.roleId = role.roleId ';
empQuery += 'ORDER by e.empId';

let mgrName = "";

connection.connect((error) => {
  if (error) throw error;
  administer_db();
});

const administer_db = () => {
    inquirer
      .prompt({
        type: 'list',
        message: 'Which operation would you like to perform?', 
        name: 'operation', 
        choices: 
        [
            'View All Employees',
            'View All Employees by Department',
            'View All Employees by Manager',
            'Add New Employee',
            'Remove Employee',
            'View All Roles',
            'Done',
        ]
      })
      .then((answer) => {
        switch (answer.operation) {
            case 'View All Employees':
                viewEmps('all');
                break;
            case 'View All Employees by Department':
                viewEmpsByDept();
                return;
            case 'View All Employees by Manager':
                viewEmpsByMgr();
                return;
            case 'Add New Employee':
                addEmp();
                break;
            case 'Remove Employee':
                deleteEmp();
                break;
            case 'View All Roles':
                addInternDetails();
                break;
            case 'Done':
                addInternDetails();
                break;
            default:
                console.log(`Please select an option`);
        }
    });
};

const viewEmps = (val) => {

    //https://dba.stackexchange.com/questions/129023/selecting-data-from-another-table-using-a-foreign-key

    //print all emps
    connection.query(empQuery, function (err, result, fields) {
        if (err) throw err;
        let empArr = [];
        Object.keys(result).forEach(function(key) {
            let mgrName = '';
            let row = result[key];
            if (row.mgr_Fname !== null)
                mgrName = row.mgr_Fname + ' ' + row.mgr_Lname;
            else
                mgrName = 'No Manager';
            const emp = new Employee (row.Id, row.fName, row.lName, row.title, mgrName);
            empArr.push(emp);
        });
        console.table(empArr);
        administer_db();
    });
};

const viewEmpsByDept = () => {
    let deptSelectQuery = 'SELECT * from department ';
    let deptSelectArr = [];
    
    connection.query(deptSelectQuery, function (err, result, fields) {
        if (err) throw err;
        Object.keys(result).forEach(function(key) {
            let row = result[key];
            const dept = new Department (row.deptId, row.deptName);
            //This array will be used for the next inquirer list
            deptSelectArr.push(dept.deptName);
        });
        //Now that the possible depts have been found, find which they want to view by
        inquirer.prompt({
            name: 'selection',
            type: 'list',
            message: 'Select the departent you want to view',
            choices: deptSelectArr
        })
        .then((answer) => {
            //print all emps by department
            let deptQuery = 'SELECT e.empId as Id, e.first_name as fName, e.last_name as lName, r.title as title, d.deptName, ';
            deptQuery += '(Select b.first_name from employee as b where e.mgrId = b.empId) as mgr_Fname, ';
            deptQuery += '(Select b.last_name from employee as b where e.mgrId = b.empId) as mgr_Lname ';
            deptQuery += 'FROM employee as e ';
            deptQuery += 'LEFT JOIN role as r ON e.roleId = r.roleId ';
            deptQuery += 'JOIN department as d ON r.deptID = d.deptId ';
            deptQuery += 'WHERE d.deptName = ? ';
            deptQuery += 'order by e.empId ';

            connection.query(deptQuery, [answer.selection], function (err, result, fields) {
                if (err) throw err;
                let empArr = [];
                Object.keys(result).forEach(function(key) {
                    let mgrName = '';
                    let row = result[key];
                    if (row.mgr_Fname !== null)
                        mgrName = row.mgr_Fname + ' ' + row.mgr_Lname;
                    else
                        mgrName = 'No Manager';
                    const emp = new Employee (row.Id, row.fName, row.lName, row.title, mgrName);
                    empArr.push(emp);
                });
                console.table(empArr);
                administer_db();
            });
        });
    });
};

const viewEmpsByMgr = () => {
    let mgrSelectQuery = 'SELECT empId, first_name, last_name FROM employee WHERE mgrId IS NULL ';
    let mgrSelectArr = [];
    
    connection.query(mgrSelectQuery, function (err, result, fields) {
        if (err) throw err;
        Object.keys(result).forEach(function(key) {
            let row = result[key];
            const mgr = `ID: ${row.empId} - ${row.first_name} ${row.last_name}`;
            //This array will be used for the next inquirer list
            mgrSelectArr.push(mgr);

        });
        //Now that the possible mgrs have been found, find which they want to view by
        inquirer.prompt({
            name: 'selection',
            type: 'list',
            message: 'Select the departent you want to view',
            choices: mgrSelectArr
        })
        .then((answer) => {
            //This splits up the selection so that I can pull away the mgrId (e.g. empId)
            let mgrString = answer.selection;
            const mgrChosen = mgrString.split(" ");
            const choiceId = mgrChosen[1];
            mgrName = mgrChosen[3] + " " + mgrChosen[4];

            //print all emps by department
            let teamQuery = 'SELECT e.empId as Id, e.first_name as fName, e.last_name as lName, r.title as title ';
            teamQuery += 'FROM employee as e ';
            teamQuery += 'LEFT JOIN role as r ON e.roleId = r.roleId ';
            teamQuery += 'WHERE e.mgrId = ? ';
            teamQuery += 'order by e.empId ';

            connection.query(teamQuery, [choiceId], function (err, result, fields) {
                if (err) throw err;
                let mgrArr = [];
                Object.keys(result).forEach(function(key) {
                    let row = result[key];
                    const emp = new Employee (row.Id, row.fName, row.lName, row.title, mgrName);
                    mgrArr.push(emp);
                });
                console.table(mgrArr);
                administer_db();
            });
        });
    });
};

const addEmp = () => {
    const roleQuery = 'SELECT roleId, title, max_salary FROM role ';
    const mgrQuery = 'SELECT empId, first_name, last_name FROM employee WHERE mgrId IS NULL ';
    
    let mgrSelectArr = [];
    let roleSelectArr = [];
    
    connection.query(mgrQuery, function (err, result, fields) {
        if (err) throw err;
        Object.keys(result).forEach(function(key) {
            let row = result[key];
            const mgrs = `ID: ${row.empId} - ${row.first_name} ${row.last_name}`;
            //This array will be used for the next inquirer list
            mgrSelectArr.push(mgrs);

        });

        connection.query(roleQuery, function (err, result, fields) {
            if (err) throw err;
            Object.keys(result).forEach(function(key) {
                let row = result[key];
                const role = new Role (row.roleId, row.title, row.max_salary, row.deptId);
                //This array will be used for the next inquirer list
                roleSelectArr.push(role.title);
            });

            inquirer
            .prompt([
                {
                    name: 'first_name',
                    type: 'input',
                    message: 'What is the new employees first name?',
                    validate: async (input) => {
                        if (input.length === 0) 
                        {
                            return 'You must enter something!';
                        }
                        return true;
                    }
                },
                {
                    name: 'last_name',
                    type: 'input',
                    message: 'What is the new employees last name?',
                    validate: async (input) => {
                        if (input.length === 0) 
                        {
                            return 'You must enter something!';
                        }
                        return true;
                    }
                },
                {
                    name: 'selectedRole',
                    type: 'list',
                    message: 'What is the new employees role?',
                    choices: roleSelectArr
                },
                {
                    name: 'selectedMgr',
                    type: 'list',
                    message: 'Who will be their manager?',
                    choices: mgrSelectArr
                },
            ])
            .then((answer) => {
                let mgrString = answer.selectedMgr;
                const mgrChosen = mgrString.split(" ");
                const choiceId = mgrChosen[1];

                let insertSQL = 'INSERT INTO hr_db.employee (first_name, last_name, roleId, mgrId) ';
                insertSQL += `VALUES  ('${answer.first_name}', '${answer.last_name}', `;
                insertSQL += '(SELECT roleId FROM role WHERE title = ?), ?) '; 
                
                connection.query(insertSQL, [answer.selectedRole, choiceId], function (err, result, fields) {
                    if (err) throw err;
                    console.log (`${answer.first_name} ${answer.last_name} has been added.`);
                    //START OVER
                    administer_db();
                });
            });
        });
    });
}

function Employee (empId, first_name, last_name, title, mgrName ) {
    this.empId = empId;
    this.first_name = first_name;
    this.last_name = last_name;
    this.title = title;
    this.mgrName = mgrName;
}

function Department (deptId, deptName) {
    this.deptId = deptId;
    this.deptName = deptName;
}

function Role (roleId, title, max_salary, deptId) {
    this.roleId = roleId;
    this.title = title;
    this.max_salary = max_salary;
    this.deptId = deptId;
}