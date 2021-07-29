//install mysql
const mysql = require('mysql');
//Instatll inquirer
const inquirer = require('inquirer');

const connection = mysql.createConnection({
    host: 'localhost',
    //Port
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

//upon successful connect, the administer_db is kicked off
connection.connect((error) => {
  if (error) throw error;
  administer_db();
});

//This administer_db allows a user to administrate the employee db with various functions
const administer_db = () => {
    inquirer
      .prompt({
        type: 'list',
        message: 'Which operation would you like to perform?', 
        name: 'operation', 
        choices: 
        [
            'View All Employees',
            'Add New Employee',
            'Remove Employee',
            'View All Roles',
            'Add New Role',
            'Delete a Role',
            'View All Departments',
            'Add New Department',
            'Delete a Department',
            'Update Employee Manager',
            'Update Employee Role',
            'View All Employees by Department',
            'View All Employees by Manager',
            'Done',
        ]
      })
      .then((answer) => {
        switch (answer.operation) {
            case 'View All Employees':
                viewEmps('all');
                break;
            case 'Add New Employee':
                addEmp();
                break;
            case 'Delete a Employee':
                deleteEmp();
                break;
            case 'View All Roles':
                viewRoles();
                break;
            case 'Add New Role':
                addRole();
                break;
            case 'Delete a Role':
                deleteRole();
                break;
            case 'View All Departments':
                viewDepts();
                break;
            case 'Add New Department':
                addDept();
                break;
            case 'Delete a Department':
                deleteDept();
                break;
            case 'Update Employee Manager':
                updateEmpMgr();
                return;
            case 'Update Employee Role':
                updateEmpRole();
                return;
            case 'View All Employees by Department':
                viewEmpsByDept();
                return;
            case 'View All Employees by Manager':
                viewEmpsByMgr();
                return;
            case 'Done':
                console.log('Goodbye.')
                connection.end();
                break;
            default:
                console.log(`Please select an option`);
                break;
        }
    });
};

//User can view all employees with this funciton
const viewEmps = (val) => {
    //print all emps
    connection.query(empQuery, function (err, result, fields) {
        //if unsuccessful query, an error is thrown
        if (err) throw err;
        //Placeholder arr for the employee results
        let empArr = [];
        //Loop through results and build out empArr with all of the employee results.  
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

const deleteEmp = () => {
    //Query all employees for the user to select from
    connection.query(empQuery, function (err, result, fields) {
        if (err) throw err;
        let empArr = [];
        Object.keys(result).forEach(function(key) {
            let row = result[key];
            const emp = new Employee (row.Id, row.fName, row.lName, row.title, mgrName);
            empArr.push(`Employee#: ${row.Id} Name: ${row.fName} ${row.lName}`);
        });

        //Now determine which employee to delete
        inquirer.prompt({
            name: 'toDelete',
            type: 'list',
            message: 'Select an employee to be deleted:',
            choices: empArr
        })
        .then((answer) => {
            let empString = answer.toDelete;
            const empArr = empString.split(" ");
            const empDelete = empArr[1];
            //Now delete the selected employee
            
            let delQuery = `DELETE FROM employee WHERE empId = ?`;

            connection.query(delQuery, [empDelete], function (err, result, fields) {
                if (err) throw err;
                console.log (`${empArr[3]} ${empArr[4]} with Employee# ${empArr[1]} has been ermoved.`);
                //START OVER
                administer_db();
            });
        });
    });
}

const viewRoles = () => {
    //Query all employees for the user to select from
    let roleQuery = 'SELECT r.roleId, r.title, r.max_salary, d.deptId, d.deptName ';
    roleQuery += 'FROM role AS r ';
    roleQuery += 'JOIN department AS d ON r.deptId = d.deptId ';
    roleQuery += 'ORDER BY r.roleId ';

    connection.query(roleQuery, function (err, result, fields) {
        if (err) throw err;
        let roleArr = [];
        Object.keys(result).forEach(function(key) {
            let row = result[key];
            roleArr.push(row);
        });
        console.table (roleArr)
        //START OVER
        administer_db();
    });
}

const addRole = () => {
    //Select all Departments
    let deptQuery = 'SELECT * from department';
    
    //This builds out the array of depts to be used while adding a new role
    connection.query(deptQuery, function (err, result, fields) {
        if (err) throw err;
        let deptArr = [];
        Object.keys(result).forEach(function(key) {
            let row = result[key];
            deptArr.push(`Dept Id#: ${row.deptId} Dept Name: ${row.deptName}`);
        });
        
        inquirer
        .prompt([
            {
                name: 'title',
                type: 'input',
                message: 'What is the new role title?',
                validate: async (input) => {
                    if (input.length === 0) 
                    {
                        return 'You must enter something!';
                    }
                    return true;
                }
            },
            {
                name: 'max_salary',
                type: 'input',
                message: 'What is the new role salary cap?',
                validate: async (input) => {
                    if (input.length === 0)
                    {
                        return 'You must enter something!';
                    }
                    return true;
                }
            },
            {
                name: 'deptId',
                type: 'list',
                message: 'Which department is associated with this role?',
                choices: deptArr
            },
        ])
        .then((answer) => {
            let deptString = answer.deptId;
            const deptChosen = deptString.split(" ");
            const choiceId = deptChosen[2];

            let insertSQL = 'INSERT INTO role (title, max_salary, deptId) ';
            insertSQL += `VALUES  ('${answer.title}','${answer.max_salary}',${choiceId})`;
            
            connection.query(insertSQL, function (err, result, fields) {
                if (err) throw err;
                console.log (`${answer.title} has been added.`);
                //START OVER
                administer_db();
            });
        });
    });
}

const deleteRole = () => {
    //Query all employees for the user to select from
    let roleDelQuery = 'SELECT * FROM role';
    connection.query(roleDelQuery, function (err, result, fields) {
        if (err) throw err;
        let roleArray = [];
        Object.keys(result).forEach(function(key) {
            let row = result[key];
            roleArray.push(`RoleId#: ${row.roleId} Name: ${row.title}`);
        });

        //Now determine which employee to delete
        inquirer.prompt({
            name: 'toDelete',
            type: 'list',
            message: 'Select a role to delete:',
            choices: roleArray
        })
        .then((answer) => {
            let roleString = answer.toDelete;
            const delStr = roleString.split(" ");
            //Now delete the selected employee
            
            let delQuery = `DELETE FROM role WHERE roleId = ?`;

            connection.query(delQuery, [delStr[1]], function (err, result, fields) {
                if (err) throw err;
                console.log (`Role id# ${delStr[1]} ${delStr[3]} has been ermoved.`);
                //START OVER
                administer_db();
            });
        });
    });
}

const viewDepts = () => {
    let deptSelectQuery = 'SELECT * from department ';
    let deptSelectArr = [];
    
    connection.query(deptSelectQuery, function (err, result, fields) {
        if (err) throw err;
        Object.keys(result).forEach(function(key) {
            let row = result[key];
            //This array will be used for the next inquirer list
            deptSelectArr.push(row);
        });
        console.table(deptSelectArr);
    });
}

const addDept = () => {
    inquirer
    .prompt([
        {
            name: 'deptName',
            type: 'input',
            message: 'What is the name of your new Department?',
            validate: async (input) => {
                if (input.length === 0) 
                {
                    return 'You must enter something!';
                }
                return true;
            }
        },
    ])
    .then((answer) => {
        let insertSQL = 'INSERT INTO department (deptName) ';
        insertSQL += `VALUES  ('${answer.deptName}')`;
        
        connection.query(insertSQL, function (err, result, fields) {
            if (err) throw err;
            console.log (`${answer.deptName} has been added.`);
            //START OVER
            administer_db();
        });
    });
}

const deleteDept = () => {
    //Query all employees for the user to select from
    let roleDelQuery = 'SELECT * FROM department';
    connection.query(roleDelQuery, function (err, result, fields) {
        if (err) throw err;
        let deptArray = [];
        Object.keys(result).forEach(function(key) {
            let row = result[key];
            deptArray.push(`DeptId#: ${row.deptId} Name: ${row.deptName}`);
        });

        //Now determine which employee to delete
        inquirer.prompt({
            name: 'toDelete',
            type: 'list',
            message: 'Select a role to delete:',
            choices: deptArray
        })
        .then((answer) => {
            let roleString = answer.toDelete;
            const delStr = roleString.split(" ");
            //Now delete the selected employee
            
            let delQuery = `DELETE FROM department WHERE deptId = ?`;

            connection.query(delQuery, [delStr[1]], function (err, result, fields) {
                if (err) throw err;
                console.log (`Dept id# ${delStr[1]} ${delStr[3]} has been ermoved.`);
            });
            //START OVER
            administer_db();
        });
    });
}

const updateEmpMgr = () => {
    //creating selector list with all emps and their manager name
    connection.query(empQuery, function (err, result, fields) {
        if (err) throw err;
        let empArr2GetNewmanager = [];
        let empArrNewManager = [];
        Object.keys(result).forEach(function(key) {
            let mgrName = '';
            let row = result[key];
            if (row.mgr_Fname !== null)
                mgrName = row.mgr_Fname + ' ' + row.mgr_Lname;
            else
                mgrName = 'No Manager';
            empArr2GetNewmanager.push(`EmpId#: ${row.Id} ${row.fName} ${row.lName} with Manager ${mgrName} `);
            empArrNewManager.push(`EmpId#: ${row.Id} ${row.fName} ${row.lName}`);
        });
        
        inquirer.prompt([
            {
                name: 'employee',
                type: 'list',
                message: 'Which employee do you want to assign a new Manager?',
                choices: empArr2GetNewmanager,
            },
            {
                name: 'newManager',
                type: 'list',
                message: 'Which employee should be their new manager?',
                choices: empArrNewManager,
            },
        ])
        .then((answer) => {
            let emp2Change = answer.employee;
            const empSplit = emp2Change.split(" ");
            const empId = empSplit[1];

            let mgr4update = answer.newManager;
            const mgrSplit = mgr4update.split(" ");
            const mgrId = mgrSplit[1];

            let updateSQL = 'UPDATE employee ';
            updateSQL += 'SET mgrId = ? ';
            updateSQL += 'WHERE empId = ? '; 
            console.log (updateSQL);
            
            connection.query(updateSQL, [mgrId, empId], function (err, result, fields) {
                if (err) throw err;
                console.log ('Employee manager updated');
            });
            //START OVER
            administer_db();
        });
    });
}

const updateEmpRole = () => {
    //creating selector list with all emps and their role
    connection.query(empQuery, function (err, result, fields) {
        if (err) throw err;
        let empArr2GetNewRole = [];
        let newRoles = [];
        //This create array of all employees with current title
        Object.keys(result).forEach(function(key) {
            let row = result[key];
            empArr2GetNewRole.push(`EmpId#: ${row.Id} ${row.fName} ${row.lName} with title ${row.title} `);
        });

        connection.query('SELECT * FROM role', function (err, result, fields) {
            //This create array of all all titles available
            Object.keys(result).forEach(function(key) {
                let row = result[key];
                newRoles.push(`RoleId#: ${row.roleId} Title: ${row.title}`);
            });
        
            inquirer.prompt([
                {
                    name: 'employee',
                    type: 'list',
                    message: 'Which employee do you want to assign a new role?',
                    choices: empArr2GetNewRole,
                },
                {
                    name: 'newRole',
                    type: 'list',
                    message: 'What is their new role?',
                    choices: newRoles,
                },
            ])
            .then((answer) => {
                let emp2Change = answer.employee;
                const empSplit = emp2Change.split(" ");
                const empId = empSplit[1];

                let role4update = answer.newRole;
                const roleSplit = role4update.split(" ");
                const roleId = roleSplit[1];

                let updateSQL = 'UPDATE employee ';
                updateSQL += 'SET roleId = ? ';
                updateSQL += 'WHERE empId = ? '; 
                
                connection.query(updateSQL, [roleId, empId], function (err, result, fields) {
                    if (err) throw err;
                    console.log ('/n Employee role updated');
                });

                //START OVER
                administer_db();
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